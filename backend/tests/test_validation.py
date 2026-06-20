"""Тесты предиката валидности времени начала брони (порождает 422)."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.scheduling import is_valid_start

MSK = ZoneInfo("Europe/Moscow")


def test_valid_grid_start_within_hours():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)  # понедельник
    start = datetime(2026, 6, 15, 10, 0, tzinfo=MSK)
    assert is_valid_start(start, 30, now, MSK) is True


def test_off_grid_start_is_invalid():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    start = datetime(2026, 6, 15, 10, 5, tzinfo=MSK)  # не на 30-мин сетке
    assert is_valid_start(start, 30, now, MSK) is False


def test_outside_work_hours_is_invalid():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    too_early = datetime(2026, 6, 15, 8, 30, tzinfo=MSK)
    assert is_valid_start(too_early, 30, now, MSK) is False


def test_event_must_fit_until_workday_end():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    start = datetime(2026, 6, 15, 17, 30, tzinfo=MSK)  # 60 мин не влезает до 18:00
    assert is_valid_start(start, 60, now, MSK) is False


def test_weekend_start_is_invalid():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)  # понедельник
    saturday = datetime(2026, 6, 20, 10, 0, tzinfo=MSK)
    assert is_valid_start(saturday, 30, now, MSK) is False


def test_past_start_is_invalid():
    now = datetime(2026, 6, 15, 11, 0, tzinfo=MSK)
    past = datetime(2026, 6, 15, 10, 0, tzinfo=MSK)
    assert is_valid_start(past, 30, now, MSK) is False


def test_beyond_window_is_invalid():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=MSK)
    far = datetime(2026, 6, 15, 10, 0, tzinfo=MSK) + timedelta(days=20)
    assert is_valid_start(far, 30, now, MSK) is False
