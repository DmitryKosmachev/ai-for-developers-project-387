"""Тесты эндпоинтов owner и event-types."""


def test_get_owner_returns_seeded_profile(client):
    res = client.get("/owner")
    assert res.status_code == 200
    body = res.json()
    assert body["name"]
    assert body["timezone"]


def test_list_event_types_seeded(client):
    res = client.get("/event-types")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    sample = items[0]
    assert {"id", "title", "description", "durationMinutes"} <= sample.keys()


def test_get_event_type_by_id(client):
    listed = client.get("/event-types").json()
    target = listed[0]
    res = client.get(f"/event-types/{target['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == target["id"]


def test_get_unknown_event_type_404(client):
    res = client.get("/event-types/does-not-exist")
    assert res.status_code == 404
    assert res.json()["code"] == "not_found"


def test_create_event_type(client):
    res = client.post(
        "/event-types",
        json={
            "title": "Демо",
            "description": "Тестовая встреча",
            "durationMinutes": 30,
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["id"]
    assert body["title"] == "Демо"
    assert body["durationMinutes"] == 30
    # появился в списке
    ids = [e["id"] for e in client.get("/event-types").json()]
    assert body["id"] in ids


def test_create_event_type_non_multiple_of_30_is_422(client):
    res = client.post(
        "/event-types",
        json={"title": "Кривая", "description": "", "durationMinutes": 45},
    )
    assert res.status_code == 422
    assert res.json()["code"] == "validation_error"


def test_create_event_type_zero_duration_is_422(client):
    res = client.post(
        "/event-types",
        json={"title": "Ноль", "description": "", "durationMinutes": 0},
    )
    assert res.status_code == 422
    assert res.json()["code"] == "validation_error"
