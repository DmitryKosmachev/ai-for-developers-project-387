### Hexlet tests and linter status:
[![Actions Status](https://github.com/DmitryKosmachev/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/DmitryKosmachev/ai-for-developers-project-387/actions)

# Запись на созвон

Упрощённый сервис бронирования времени по мотивам Cal.com: владелец публикует типы
встреч, гость выбирает свободный слот в окне 14 дней и записывается на созвон.

🔗 **Опубликованное приложение:** https://ai-for-developers-project-387-vfxy.onrender.com/

## Структура

| Каталог | Назначение |
|---|---|
| [`spec/`](spec/) | API-контракт на TypeSpec → OpenAPI (источник правды) |
| [`frontend/`](frontend/) | UI: React + Vite + TypeScript + shadcn/ui |
| [`backend/`](backend/) | API: FastAPI, хранилище в памяти, бизнес-правила бронирования |
| [`e2e/`](e2e/) | Интеграционные сценарии на Playwright |

## Запуск

- Локально через Docker: см. [`DEPLOY.md`](DEPLOY.md).
- По частям (контракт / фронт / бэк / e2e): см. README в соответствующих каталогах.

Разработка ведётся по подходу **Design First** и с автоматизацией релизов
(Conventional Commits + release-please). Подробности — в [`CLAUDE.md`](CLAUDE.md).
