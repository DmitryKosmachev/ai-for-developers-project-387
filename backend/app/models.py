"""Pydantic-схемы по API-контракту (camelCase наружу, snake_case в коде)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Базовая модель: поля snake_case, наружу — camelCase, как в контракте."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class Owner(ApiModel):
    name: str
    timezone: str


class EventType(ApiModel):
    id: str
    title: str
    description: str
    duration_minutes: int


class EventTypeCreate(ApiModel):
    title: str
    description: str
    duration_minutes: int


class Slot(ApiModel):
    start: datetime
    end: datetime


class Booking(ApiModel):
    id: str
    event_type_id: str
    start: datetime
    end: datetime
    guest_name: str
    guest_email: str
    comment: str | None = None
    created_at: datetime


class BookingCreate(ApiModel):
    event_type_id: str
    start: datetime
    guest_name: str = Field(min_length=1)
    guest_email: EmailStr
    comment: str | None = None


class ApiError(ApiModel):
    code: str
    message: str
