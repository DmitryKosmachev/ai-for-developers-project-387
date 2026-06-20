from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query

from app.config import SLOT_MINUTES, WINDOW_DAYS
from app.errors import not_found, validation_error
from app.models import EventType, EventTypeCreate, Slot
from app.scheduling import generate_slots
from app.store import store

UTC = ZoneInfo("UTC")

router = APIRouter(prefix="/event-types")


@router.get("", response_model=list[EventType], tags=["Гость"])
def list_event_types() -> list[EventType]:
    return store.list_event_types()


@router.get("/{event_type_id}", response_model=EventType, tags=["Гость"])
def get_event_type(event_type_id: str) -> EventType:
    event_type = store.get_event_type(event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден")
    return event_type


@router.get(
    "/{event_type_id}/slots", response_model=list[Slot], tags=["Гость"]
)
def get_slots(
    event_type_id: str,
    from_: datetime | None = Query(default=None, alias="from"),
    days: int | None = Query(default=None),
) -> list[Slot]:
    event_type = store.get_event_type(event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден")

    now = from_ or datetime.now(UTC)
    if now.tzinfo is None:
        now = now.replace(tzinfo=UTC)

    return generate_slots(
        duration_minutes=event_type.duration_minutes,
        existing_bookings=store.booking_intervals(),
        now=now,
        tz=ZoneInfo(store.owner.timezone),
        window_days=days or WINDOW_DAYS,
    )


@router.post("", response_model=EventType, status_code=201, tags=["Владелец"])
def create_event_type(data: EventTypeCreate) -> EventType:
    if data.duration_minutes <= 0 or data.duration_minutes % SLOT_MINUTES != 0:
        raise validation_error(
            "durationMinutes должно быть кратно 30 и больше нуля"
        )
    return store.add_event_type(data)
