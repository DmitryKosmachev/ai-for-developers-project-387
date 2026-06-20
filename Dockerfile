# syntax=docker/dockerfile:1

# --- Stage 1: сборка фронтенда (Vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Пустой базовый URL => фронт обращается к API того же origin (относительные пути).
ENV VITE_API_BASE_URL=""
RUN npm run build


# --- Stage 2: бэкенд (FastAPI) + статика фронта ---
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Код бэкенда.
COPY backend/app ./app
# Собранный фронт кладём туда, откуда его отдаёт FastAPI (app/static).
COPY --from=frontend /app/frontend/dist ./app/static

EXPOSE 8000

# Приложение стартует автоматически и слушает порт из переменной окружения PORT.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
