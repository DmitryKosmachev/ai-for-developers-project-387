"""FastAPI-приложение «Запись на созвон». Реализация контракта из spec/."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.errors import ApiException
from app.routers import bookings, event_types, owner

# Каталог собранного фронтенда (появляется в Docker-образе). В dev его нет.
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="Запись на созвон API", version="1.0.0")

# Фронтенд — отдельный клиент; для разработки разрешаем любые источники.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiException)
def handle_api_exception(_request: Request, exc: ApiException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(RequestValidationError)
def handle_validation_error(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Приводим ошибки валидации тела запроса к формату контракта."""
    errors = exc.errors()
    if errors:
        first = errors[0]
        location = ".".join(str(p) for p in first.get("loc", []) if p != "body")
        message = first.get("msg", "Некорректные данные")
        if location:
            message = f"{location}: {message}"
    else:
        message = "Некорректные данные"
    return JSONResponse(
        status_code=422,
        content={"code": "validation_error", "message": message},
    )


app.include_router(owner.router)
app.include_router(event_types.router)
app.include_router(bookings.router)


# Отдача собранного SPA с того же origin (один контейнер = API + UI на одном PORT).
# Регистрируется ПОСЛЕ API-роутов, поэтому /owner, /event-types, /bookings имеют
# приоритет, а всё остальное (включая клиентские маршруты /admin, /book/...) отдаёт
# index.html.
if STATIC_DIR.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=STATIC_DIR / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str) -> FileResponse:
        candidate = STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
