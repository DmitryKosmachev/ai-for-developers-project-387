import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter

from app.errors import not_found, slot_taken, validation_error
from app.models import Booking, BookingCreate
from app.scheduling import intervals_overlap, is_valid_start
from app.store import store

UTC = ZoneInfo("UTC")

router = APIRouter(prefix="/bookings")


@router.get("", response_model=list[Booking], tags=["Владелец"])
def list_bookings() -> list[Booking]:
    return store.list_bookings()


@router.post("", response_model=Booking, status_code=201, tags=["Гость"])
def create_booking(data: BookingCreate) -> Booking:
    event_type = store.get_event_type(data.event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден")

    start = data.start
    if start.tzinfo is None:
        start = start.replace(tzinfo=UTC)
    start = start.astimezone(UTC)

    tz = ZoneInfo(store.owner.timezone)
    now = datetime.now(UTC)
    if not is_valid_start(start, event_type.duration_minutes, now, tz):
        raise validation_error(
            "Недопустимое время слота: проверьте сетку, рабочие часы и окно записи"
        )

    end = start + timedelta(minutes=event_type.duration_minutes)
    if intervals_overlap(start, end, store.booking_intervals()):
        raise slot_taken("Этот слот уже занят")

    booking = Booking(
        id=str(uuid.uuid4()),
        event_type_id=event_type.id,
        start=start,
        end=end,
        guest_name=data.guest_name,
        guest_email=data.guest_email,
        comment=data.comment,
        created_at=now,
    )
    store.add_booking(booking)
    return booking
