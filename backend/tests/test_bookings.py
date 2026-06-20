"""Тесты бронирования: успех, занятый слот (409), валидация (422), 404."""

from datetime import datetime, timedelta


def first_event_type(client):
    return client.get("/event-types").json()[0]


def first_free_slot(client, event_type_id):
    slots = client.get(f"/event-types/{event_type_id}/slots").json()
    assert slots, "ожидались свободные слоты"
    return slots[0]


def book(client, event_type_id, start, **overrides):
    payload = {
        "eventTypeId": event_type_id,
        "start": start,
        "guestName": "Гость",
        "guestEmail": "guest@example.com",
    }
    payload.update(overrides)
    return client.post("/bookings", json=payload)


def test_create_booking_success(client):
    et = first_event_type(client)
    slot = first_free_slot(client, et["id"])

    res = book(client, et["id"], slot["start"], comment="Обсудить проект")
    assert res.status_code == 201
    body = res.json()
    assert body["id"]
    assert body["eventTypeId"] == et["id"]
    assert body["start"]
    assert body["end"]  # сервер посчитал end
    assert body["guestName"] == "Гость"
    assert body["comment"] == "Обсудить проект"
    assert body["createdAt"]


def test_booked_slot_is_removed_from_availability(client):
    et = first_event_type(client)
    slot = first_free_slot(client, et["id"])
    book(client, et["id"], slot["start"])

    remaining = client.get(f"/event-types/{et['id']}/slots").json()
    starts = {s["start"] for s in remaining}
    assert slot["start"] not in starts


def test_double_booking_same_slot_is_409(client):
    et = first_event_type(client)
    slot = first_free_slot(client, et["id"])

    first = book(client, et["id"], slot["start"])
    assert first.status_code == 201

    second = book(client, et["id"], slot["start"])
    assert second.status_code == 409
    assert second.json()["code"] == "slot_taken"


def test_slot_busy_across_event_types_is_409(client):
    types = client.get("/event-types").json()
    a, b = types[0], types[1]
    slot = first_free_slot(client, a["id"])

    assert book(client, a["id"], slot["start"]).status_code == 201
    # другой тип события на то же время — глобальная занятость
    clash = book(client, b["id"], slot["start"])
    assert clash.status_code == 409
    assert clash.json()["code"] == "slot_taken"


def test_unknown_event_type_is_404(client):
    slot_like = "2030-01-07T09:00:00+00:00"
    res = book(client, "nope", slot_like)
    assert res.status_code == 404
    assert res.json()["code"] == "not_found"


def test_off_grid_start_is_422(client):
    et = first_event_type(client)
    slot = first_free_slot(client, et["id"])
    off_grid = (
        datetime.fromisoformat(slot["start"]) + timedelta(minutes=5)
    ).isoformat()

    res = book(client, et["id"], off_grid)
    assert res.status_code == 422
    assert res.json()["code"] == "validation_error"


def test_past_start_is_422(client):
    et = first_event_type(client)
    past = (datetime.now().astimezone() - timedelta(days=2)).isoformat()
    res = book(client, et["id"], past)
    assert res.status_code == 422
    assert res.json()["code"] == "validation_error"


def test_invalid_email_is_422(client):
    et = first_event_type(client)
    slot = first_free_slot(client, et["id"])
    res = book(client, et["id"], slot["start"], guestEmail="not-an-email")
    assert res.status_code == 422
    assert res.json()["code"] == "validation_error"


def test_list_bookings_sorted_by_start(client):
    types = client.get("/event-types").json()
    et = types[0]
    slots = client.get(f"/event-types/{et['id']}/slots").json()
    # бронируем два не подряд идущих слота в обратном порядке
    later = slots[5]
    earlier = slots[0]
    assert book(client, et["id"], later["start"]).status_code == 201
    assert book(client, et["id"], earlier["start"]).status_code == 201

    listed = client.get("/bookings").json()
    starts = [b["start"] for b in listed]
    assert starts == sorted(starts)
    assert len(listed) == 2
