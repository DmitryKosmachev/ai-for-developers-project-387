import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using Rest;
using OpenAPI;

/**
 * «Запись на созвон» — упрощённый сервис бронирования времени по мотивам Cal.com.
 *
 * Роли (без авторизации):
 *  - Владелец календаря — единственный заранее заданный профиль. Создаёт типы
 *    событий и просматривает список всех предстоящих встреч.
 *  - Гость — без регистрации. Смотрит виды брони, выбирает свободный слот в окне
 *    14 дней и оформляет запись.
 *
 * Базовые правила:
 *  - Слоты формируются по 30-минутной сетке, пн–пт, 09:00–18:00 (по owner.timezone).
 *  - Окно записи — 14 дней от текущей даты.
 *  - Событие длительностью N минут занимает N/30 смежных свободных ячеек.
 *  - Глобальная занятость: на пересекающееся по времени окно нельзя создать две
 *    брони, даже если это разные типы событий.
 */
@service(#{ title: "Запись на созвон API" })
@info(#{ version: "1.0.0" })
@server("http://localhost:3000", "Локальный сервер разработки")
namespace CallBooking;

// ---------------------------------------------------------------------------
// Доменные сущности
// ---------------------------------------------------------------------------

/** Профиль владельца календаря (единственный, только чтение). */
model Owner {
  /** Отображаемое имя владельца — «Записаться на созвон к …». */
  name: string;

  /** IANA-таймзона владельца, по ней считаются рабочие часы (напр. "Europe/Moscow"). */
  timezone: string;
}

/** Тип события (вид встречи), которым управляет владелец. */
model EventType {
  /** Уникальный идентификатор (UUID), назначается сервером. */
  @visibility(Lifecycle.Read)
  id: string;

  /** Короткое название типа встречи. */
  title: string;

  /** Описание типа встречи для гостя. */
  description: string;

  /**
   * Длительность встречи в минутах.
   * Должна быть кратна 30 и не меньше 30 (одна или несколько 30-мин ячеек).
   */
  @minValue(30)
  durationMinutes: int32;
}

/** Тело запроса на создание типа события (id назначает сервер). */
model EventTypeCreate {
  title: string;
  description: string;

  /** Кратно 30, минимум 30. */
  @minValue(30)
  durationMinutes: int32;
}

/**
 * Свободный слот — вычисляемый интервал, в БД не хранится.
 * Возвращается для конкретного типа события: начиная с `start` подряд свободны
 * N = durationMinutes/30 ячеек, всё внутри рабочих часов и окна 14 дней.
 */
model Slot {
  /** Начало слота, выровнено по 30-минутной сетке (ISO 8601, UTC). */
  start: utcDateTime;

  /** Конец слота = start + durationMinutes типа события (ISO 8601, UTC). */
  end: utcDateTime;
}

/** Оформленная запись на встречу. */
model Booking {
  /** Уникальный идентификатор брони (UUID), назначается сервером. */
  @visibility(Lifecycle.Read)
  id: string;

  /** Идентификатор типа события, к которому относится бронь. */
  eventTypeId: string;

  /** Начало встречи (ISO 8601, UTC). */
  start: utcDateTime;

  /** Конец встречи = start + durationMinutes, вычисляется сервером (ISO 8601, UTC). */
  @visibility(Lifecycle.Read)
  end: utcDateTime;

  /** Имя гостя. */
  guestName: string;

  /** Email гостя. */
  @format("email")
  guestEmail: string;

  /** Необязательная тема/комментарий к встрече. */
  comment?: string;

  /** Момент создания брони, назначается сервером (ISO 8601, UTC). */
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;
}

/** Тело запроса на создание брони (end, id, createdAt вычисляет сервер). */
model BookingCreate {
  /** Тип события, на который записывается гость. */
  eventTypeId: string;

  /** Выбранное начало слота (ISO 8601, UTC), должно быть на 30-мин сетке. */
  start: utcDateTime;

  guestName: string;

  @format("email")
  guestEmail: string;

  comment?: string;
}

// ---------------------------------------------------------------------------
// Ошибки (единая модель { code, message })
// ---------------------------------------------------------------------------

/** Ресурс не найден (например, неизвестный eventTypeId). */
@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

/** Слот уже занят / пересекается с существующей бронью (глобальное правило). */
@error
model SlotTakenError {
  @statusCode statusCode: 409;
  code: "slot_taken";
  message: string;
}

/**
 * Ошибка валидации: start не на 30-мин сетке, вне рабочих часов, вне окна 14 дней,
 * durationMinutes не кратно 30, невалидный email и т. п.
 */
@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "validation_error";
  message: string;
}

// ---------------------------------------------------------------------------
// Гостевой контур (публичный)
// ---------------------------------------------------------------------------

@route("/owner")
@tag("Гость")
interface OwnerApi {
  /** Профиль владельца для шапки публичной страницы. */
  @get
  get(): Owner;
}

@route("/event-types")
@tag("Гость")
interface EventTypes {
  /** Список видов брони (title, description, durationMinutes). */
  @get
  list(): EventType[];

  /** Детали одного типа события. */
  @get
  @route("{id}")
  read(@path id: string): EventType | NotFoundError;

  /**
   * Свободные слоты для типа события в окне 14 дней.
   * Учитывает глобальную занятость и помещаемость N смежных ячеек.
   */
  @get
  @route("{id}/slots")
  slots(
    @path id: string,

    /** Начало окна (по умолчанию — текущий момент). */
    @query from?: utcDateTime,

    /** Размер окна в днях (по умолчанию 14). */
    @query days?: int32,
  ): Slot[] | NotFoundError;
}

@route("/bookings")
@tag("Гость")
interface BookingsCreate {
  /** Создать бронь на выбранный слот. */
  @post
  create(@body body: BookingCreate):
    | {
        @statusCode statusCode: 201;
        @body booking: Booking;
      }
    | NotFoundError
    | SlotTakenError
    | ValidationError;
}

// ---------------------------------------------------------------------------
// Контур владельца (админский)
// ---------------------------------------------------------------------------

@route("/event-types")
@tag("Владелец")
interface EventTypesAdmin {
  /** Создать тип события. */
  @post
  create(@body body: EventTypeCreate):
    | {
        @statusCode statusCode: 201;
        @body eventType: EventType;
      }
    | ValidationError;
}

@route("/bookings")
@tag("Владелец")
interface BookingsAdmin {
  /** Все предстоящие встречи всех типов событий, отсортированы по start. */
  @get
  list(): Booking[];
}
