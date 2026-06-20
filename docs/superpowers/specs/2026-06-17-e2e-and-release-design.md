# Интеграционные сценарии + автоматизация релизов

Дата: 2026-06-17
Статус: утверждён

## Цель

Проверить связку фронтенд + бэкенд на уровне пользовательских сценариев в реальном
браузере (Playwright), запускать это в CI, и автоматизировать релизы/changelog через
release-please на основе Conventional Commits.

## Пользовательские сценарии (что проверяем)

### Сценарий 1 — основной путь бронирования (happy path)
1. Гость открывает главную, видит профиль владельца и список типов встреч.
2. Выбирает тип встречи → открывается страница бронирования.
3. Видит свободные слоты на 14 дней, выбирает время.
4. Заполняет имя и email, отправляет форму.
5. Видит экран подтверждения с выбранным временем.

### Сценарий 2 — занятость слота
6. После брони владелец в админке видит созданную встречу.
7. Забронированный слот пропадает из списка доступных (повторно его выбрать нельзя).

### Сценарий 3 — валидация формы
8. Отправка формы без email/имени показывает ошибки и не создаёт бронь.

## Playwright

- Каталог `e2e/` (TypeScript), свой `package.json`.
- `playwright.config.ts` через `webServer` поднимает **оба** сервера:
  - бэкенд: `backend/.venv` → `uvicorn app.main:app --port 8000`;
  - фронтенд: `vite` на 5173 с `VITE_API_BASE_URL=http://localhost:8000`.
- `baseURL=http://localhost:5173`, браузер Chromium.
- Тесты независимы от порядка: выбирают первый доступный слот динамически.

## CI (GitHub Actions)

`.github/workflows/ci.yml`:
- job **backend**: Python 3.12, установка `requirements-dev.txt`, `pytest`.
- job **e2e**: Node 20 + Python 3.12, установка зависимостей фронта и e2e, установка
  браузеров Playwright, запуск `npx playwright test` (webServer стартует серверы сам).
- Триггеры: `push` и `pull_request`.

## Conventional Commits

Все коммиты (включая коммиты агента) — по спецификации
[Conventional Commits](https://www.conventionalcommits.org):
`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`, `refactor:`.
Правило зафиксировано в `CLAUDE.md`, чтобы агент соблюдал формат.
Releasable-типы (`feat`, `fix`) влияют на версию по semver.

## release-please

- `.github/workflows/release-please.yml` на `googleapis/release-please-action`,
  триггер — `push` в `main`.
- Конфигурация: `release-please-config.json` (release-type **simple**, один пакет `.`)
  и `.release-please-manifest.json` (начальная версия `0.0.0`).
- После мёрджа в `main` экшен создаёт/обновляет release-PR с `CHANGELOG.md` и
  предложенной версией; мёрдж этого PR проставляет git-тег релиза.
- Требуется включить в настройках репозитория «Allow GitHub Actions to create and
  approve pull requests» (Settings → Actions → General).

## Результат

Автоматические e2e-проверки основного сценария бронирования в CI + автоматический
changelog и версии через release-please.
