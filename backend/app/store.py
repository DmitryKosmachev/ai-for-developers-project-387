"""In-memory хранилище данных + сид. Сбрасывается при перезапуске процесса."""

import uuid

from app.config import OWNER_NAME, OWNER_TIMEZONE
from app.models import Booking, EventType, EventTypeCreate, Owner
from app.scheduling import Interval

# Демо-типы событий, создаваемые при старте.
SEED_EVENT_TYPES = [
    ("Знакомство", "Короткий ознакомительный созвон.", 30),
    ("Консультация", "Разбор задачи и развёрнутые рекомендации.", 60),
    ("Быстрый созвон", "Блиц-обсуждение одного вопроса.", 30),
]


class Store:
    owner: Owner
    event_types: dict[str, EventType]
    bookings: dict[str, Booking]

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        """Сбросить хранилище к начальному состоянию (владелец + демо-типы)."""
        self.owner = Owner(name=OWNER_NAME, timezone=OWNER_TIMEZONE)
        self.event_types = {}
        self.bookings = {}
        for title, description, duration in SEED_EVENT_TYPES:
            self._create_event_type(title, description, duration)

    def _create_event_type(
        self, title: str, description: str, duration_minutes: int
    ) -> EventType:
        event_type = EventType(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            duration_minutes=duration_minutes,
        )
        self.event_types[event_type.id] = event_type
        return event_type

    # --- event types ---

    def list_event_types(self) -> list[EventType]:
        return list(self.event_types.values())

    def get_event_type(self, event_type_id: str) -> EventType | None:
        return self.event_types.get(event_type_id)

    def add_event_type(self, data: EventTypeCreate) -> EventType:
        return self._create_event_type(
            data.title, data.description, data.duration_minutes
        )

    # --- bookings ---

    def list_bookings(self) -> list[Booking]:
        return sorted(self.bookings.values(), key=lambda b: b.start)

    def add_booking(self, booking: Booking) -> None:
        self.bookings[booking.id] = booking

    def booking_intervals(self) -> list[Interval]:
        """Занятые интервалы (UTC) для проверки пересечений и генерации слотов."""
        return [(b.start, b.end) for b in self.bookings.values()]


# Единственный экземпляр хранилища на процесс.
store = Store()
