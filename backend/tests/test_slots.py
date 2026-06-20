"""Тесты ядра генерации слотов (чистая логика, без HTTP)."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.config import WINDOW_DAYS, WORK_END_HOUR, WORK_START_HOUR, WORKDAYS
from app.scheduling import generate_slots

MSK = ZoneInfo("Europe/Moscow")


def workdays_in_window(start_date, days=WINDOW_DAYS):
    return [
        start_date + timedelta(days=i)
        for i in range(days)
        if (start_date + timedelta(days=i)).weekday() in WORKDAYS
    ]


def test_slots_respect_grid_workhours_and_window():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)  # понедельник, до начала работы
    slots = generate_slots(
        duration_minutes=30, existing_bookings=[], now=now, tz=MSK
    )

    assert slots, "должны быть свободные слоты"
    for slot in slots:
        local = slot.start.astimezone(MSK)
        # рабочий день
        assert local.weekday() in WORKDAYS
        # рабочие часы и 30-минутная сетка
        assert WORK_START_HOUR <= local.hour < WORK_END_HOUR
        assert local.minute in (0, 30)
        # не в прошлом
        assert slot.start >= now
        # длительность и помещаемость до конца рабочего дня
        assert slot.end - slot.start == timedelta(minutes=30)
        end_local = slot.end.astimezone(MSK)
        assert (end_local.hour, end_local.minute) <= (WORK_END_HOUR, 0)

    # отсортированы по возрастанию
    starts = [s.start for s in slots]
    assert starts == sorted(starts)

    # нет выходных дней
    local_dates = {s.start.astimezone(MSK).date() for s in slots}
    for d in local_dates:
        assert d.weekday() in WORKDAYS


def test_full_workday_has_18_half_hour_slots():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)  # до 09:00 — день целиком свободен
    slots = generate_slots(
        duration_minutes=30, existing_bookings=[], now=now, tz=MSK
    )

    by_date: dict = {}
    for s in slots:
        by_date.setdefault(s.start.astimezone(MSK).date(), []).append(s)

    # (18:00 - 09:00) / 30 мин = 18 слотов в полном рабочем дне
    for day_slots in by_date.values():
        assert len(day_slots) == 18

    expected_days = workdays_in_window(now.date())
    assert set(by_date.keys()) == set(expected_days)


def test_sixty_minute_event_fits_until_workday_end():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    slots = generate_slots(
        duration_minutes=60, existing_bookings=[], now=now, tz=MSK
    )

    first_day = min(s.start.astimezone(MSK).date() for s in slots)
    day_slots = [
        s for s in slots if s.start.astimezone(MSK).date() == first_day
    ]
    starts = sorted(s.start.astimezone(MSK) for s in day_slots)

    # старты 09:00..17:00 включительно с шагом 30 мин = 17 слотов, конец последнего 18:00
    assert starts[0].hour == WORK_START_HOUR and starts[0].minute == 0
    assert (starts[-1].hour, starts[-1].minute) == (17, 0)
    assert len(starts) == 17


def test_past_times_excluded_on_current_day():
    now = datetime(2026, 6, 15, 11, 15, tzinfo=MSK)  # понедельник, середина дня
    slots = generate_slots(
        duration_minutes=30, existing_bookings=[], now=now, tz=MSK
    )

    today = now.date()
    today_starts = sorted(
        s.start.astimezone(MSK)
        for s in slots
        if s.start.astimezone(MSK).date() == today
    )
    # ближайший слот по 30-мин сетке после 11:15 — это 11:30
    assert (today_starts[0].hour, today_starts[0].minute) == (11, 30)


def test_overlapping_booking_blocks_slot():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    booking_start = datetime(2026, 6, 15, 10, 0, tzinfo=MSK).astimezone(
        ZoneInfo("UTC")
    )
    booking_end = datetime(2026, 6, 15, 10, 30, tzinfo=MSK).astimezone(
        ZoneInfo("UTC")
    )
    slots = generate_slots(
        duration_minutes=30,
        existing_bookings=[(booking_start, booking_end)],
        now=now,
        tz=MSK,
    )

    blocked = datetime(2026, 6, 15, 10, 0, tzinfo=MSK)
    starts_msk = {s.start.astimezone(MSK) for s in slots}
    assert blocked not in starts_msk
    # соседние свободные слоты остаются
    assert datetime(2026, 6, 15, 9, 30, tzinfo=MSK) in starts_msk
    assert datetime(2026, 6, 15, 10, 30, tzinfo=MSK) in starts_msk
