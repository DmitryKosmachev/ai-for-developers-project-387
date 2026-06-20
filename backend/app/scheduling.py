"""Ядро бизнес-логики бронирования: генерация слотов и проверки занятости.

Чистые функции без зависимости от HTTP и хранилища — их легко тестировать.
Всё внешнее время — tz-aware; слоты возвращаются в UTC.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.config import (
    SLOT_MINUTES,
    WINDOW_DAYS,
    WORK_END_HOUR,
    WORK_START_HOUR,
    WORKDAYS,
)
from app.models import Slot

UTC = ZoneInfo("UTC")

# Интервал брони: (start_utc, end_utc).
Interval = tuple[datetime, datetime]


def intervals_overlap(start: datetime, end: datetime, existing: list[Interval]) -> bool:
    """Пересекается ли [start, end) хотя бы с одним из существующих интервалов."""
    return any(start < b_end and b_start < end for b_start, b_end in existing)


def is_valid_start(
    start: datetime,
    duration_minutes: int,
    now: datetime,
    tz: ZoneInfo,
    window_days: int = WINDOW_DAYS,
) -> bool:
    """Допустимо ли время начала брони (без учёта занятости).

    Проверяет: не в прошлом, на 30-мин сетке, рабочий день и часы, событие
    помещается до конца рабочего дня, время в пределах окна записи.
    """
    start_utc = start.astimezone(UTC)
    if start_utc < now.astimezone(UTC):
        return False

    local = start_utc.astimezone(tz)
    if local.minute not in (0, SLOT_MINUTES) or local.second or local.microsecond:
        return False
    if local.weekday() not in WORKDAYS:
        return False
    if local.hour < WORK_START_HOUR:
        return False

    day_end = datetime(
        local.year, local.month, local.day, WORK_END_HOUR, 0, tzinfo=tz
    )
    if local + timedelta(minutes=duration_minutes) > day_end:
        return False

    first_day = now.astimezone(tz).date()
    if not (first_day <= local.date() < first_day + timedelta(days=window_days)):
        return False

    return True


def generate_slots(
    duration_minutes: int,
    existing_bookings: list[Interval],
    now: datetime,
    tz: ZoneInfo,
    window_days: int = WINDOW_DAYS,
) -> list[Slot]:
    """Свободные слоты для события длительностью N минут в окне `window_days`.

    Слот попадает в выдачу, если он на 30-мин сетке, внутри рабочих часов и дней,
    помещается до конца рабочего дня, не в прошлом и не пересекается с бронями.
    """
    now_utc = now.astimezone(UTC)
    first_day = now.astimezone(tz).date()
    step = timedelta(minutes=SLOT_MINUTES)
    duration = timedelta(minutes=duration_minutes)

    slots: list[Slot] = []
    for offset in range(window_days):
        day = first_day + timedelta(days=offset)
        if day.weekday() not in WORKDAYS:
            continue

        cursor = datetime(
            day.year, day.month, day.day, WORK_START_HOUR, 0, tzinfo=tz
        )
        day_end = datetime(
            day.year, day.month, day.day, WORK_END_HOUR, 0, tzinfo=tz
        )

        while cursor + duration <= day_end:
            start_utc = cursor.astimezone(UTC)
            end_utc = (cursor + duration).astimezone(UTC)
            if start_utc >= now_utc and not intervals_overlap(
                start_utc, end_utc, existing_bookings
            ):
                slots.append(Slot(start=start_utc, end=end_utc))
            cursor += step

    slots.sort(key=lambda s: s.start)
    return slots
