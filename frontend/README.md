# Interactive Onboarding Frontend

## Run

```bash
npm i
npm run dev
```

Local app:

```text
http://127.0.0.1:5173/
```

Real API mode is enabled by default. Copy `.env.example` to `.env` only when
you need to override the API base URL, project key or switch to
`VITE_API_MODE=mock`.

## Run the full stack in Docker

From the repository root:

```bash
cp .env.example .env
make start
```

If `.env` already exists, make sure it is up to date with `.env.example`. In
particular, Docker startup requires `CLICKHOUSE_HOST=clickhouse` and the other
`CLICKHOUSE_*`, `GATEWAY_PORT` and `RUSTFS_CONSOLE_PORT` variables. Do not use
`localhost` as a database host inside Compose.

This builds the frontend image, starts both Go services and PostgreSQL, applies
migrations and loads demo scenarios. The gateway exposes the whole application
at:

```text
http://127.0.0.1/
```

The production SPA is served by the `frontend` container. Gateway routes under
`/api/v1/admin/*` and `/api/v1/widget/*` are proxied to the corresponding Go
services.

## Onboarding SDK

Инструкция по подключению SDK к React-приложению, обязательные и опциональные
пропсы, настройка роутинга и API-клиента:

- [React integration guide](./packages/onboarding-sdk/README.md)

## Chrome extension

`apps/extension` is a Manifest V3 visual editor for onboarding drafts. It uses
the Chrome Side Panel as an inspector, injects a DOM picker into the active tab,
generates stable selectors through `packages/element-selector` and saves drafts
through the existing Admin API. Publishing remains in the web admin app.

Build the unpacked extension:

```bash
npm run build:extension
```

Then open `chrome://extensions`, enable Developer mode, choose Load unpacked and
select `apps/extension/dist`. For watch mode, run:

```bash
npm run dev:extension
```

The extension requests temporary `activeTab` access and a separate permission
for the configured platform origin. Its local SDK preview does not call Widget
API, emit analytics or follow `nextUrl`. The Docker image continues to contain
only the web SPA.

Create a versioned ZIP and SHA-256 checksum for internal distribution:

```bash
npm run extension:release
```

Release and privacy checklists live in
[`apps/extension/RELEASE.md`](./apps/extension/RELEASE.md) and
[`apps/extension/PRIVACY.md`](./apps/extension/PRIVACY.md).

## Validate

Run the same checks as the frontend GitHub Actions job:

```bash
npm run ci
```
