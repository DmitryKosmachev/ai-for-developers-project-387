# CLAUDE.md

Сервис «Запись на созвон» — упрощённый Cal.com. Разработка по подходу **Design First**:
API-контракт (`spec/`) — единый источник правды; фронт и бэк реализуются по нему.

## Структура

- `spec/` — API-контракт на TypeSpec → OpenAPI (`spec/dist/openapi.yaml`).
- `frontend/` — React + Vite + TS + shadcn/ui. Ходит в API по контракту.
- `backend/` — FastAPI (Python). Хранилище в памяти. Бизнес-правила бронирования.
- `e2e/` — Playwright-сценарии (поднимает оба сервера).
- `docs/superpowers/specs/` — дизайн-документы по шагам.

## Команды

- Контракт: `cd spec && npm run build`
- Фронт: `cd frontend && npm run dev` (mock: `npm run mock`)
- Бэк: `cd backend && uvicorn app.main:app --reload --port 8000` · тесты `pytest`
- E2E: `cd e2e && npm test`

## Коммиты — Conventional Commits (обязательно, включая коммиты агента)

Формат: `<type>: <описание>`. Типы: `feat`, `fix`, `docs`, `test`, `ci`, `chore`,
`refactor`, `perf`, `build`. На версию влияют `feat` (minor) и `fix` (patch);
`feat!:` или `BREAKING CHANGE` — major.

Версии и `CHANGELOG.md` ведёт **release-please** автоматически по истории коммитов
(`release-please-config.json`). Менять версии вручную не нужно.

## Правила

- При изменении контракта: пересобрать OpenAPI, затем `cd frontend && npm run gen:api`
  и синхронно поправить фронт и бэк.
- Бэкенд пишем по TDD (тесты в `backend/tests`).
