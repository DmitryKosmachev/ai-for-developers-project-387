# Деплой

Приложение упаковано в **один Docker-образ**: бэкенд FastAPI отдаёт и API, и собранный
фронтенд (SPA) с того же origin. Контейнер слушает порт из переменной окружения `PORT`.

## Локальный запуск образа

```bash
docker build -t call-booking .
docker run -e PORT=3000 -p 3000:3000 call-booking
# открыть http://localhost:3000
```

Без `PORT` используется `8000` (значение по умолчанию).

## Деплой на Render

Вариант с Blueprint (`render.yaml` уже в репозитории):

1. Render Dashboard → **New → Blueprint** → подключить этот репозиторий.
2. Render прочитает `render.yaml`, соберёт `Dockerfile` и поднимет web-сервис.
3. `PORT` Render задаёт автоматически; healthcheck — `GET /owner`.
4. После деплоя Render выдаёт публичный URL вида `https://call-booking-XXXX.onrender.com`.

Либо вручную: **New → Web Service** → репозиторий → Runtime **Docker** → создать.

## Деплой на Railway (запасной вариант)

1. Railway → **New Project → Deploy from GitHub repo** → выбрать репозиторий.
2. Railway сам обнаружит `Dockerfile`.
3. В настройках сервиса включить публичный домен (**Settings → Networking → Generate Domain**).
   Railway прокидывает `PORT` автоматически.

## Публичная ссылка

Приложение опубликовано на Render:

**https://ai-for-developers-project-386-vfxy.onrender.com/**
