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
make start
```

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

## Validate

Run the same checks as the frontend GitHub Actions job:

```bash
npm run ci
```
