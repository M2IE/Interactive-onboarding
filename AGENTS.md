# AGENTS.md

## Go workspace monorepo

The repo uses a single `go.work` at root. All `go` commands must run from a module directory, not root:

- `services/admin/`
- `services/widget/`

The `gen/rest/v1/go/` module is a generated library consumed by the services — never edit files under `gen/` by hand.

## Commands

```bash
# Build, vet, test (run inside each service dir)
go build ./...
go vet ./...
go test -race -count=1 ./...

# Lint (from a service dir, pointing at the root config)
golangci-lint run --config=../../.golangci.yaml

# Regenerate Go + TypeScript from OpenAPI specs
make rest-gen-admin

# Start local PostgreSQL + run migrations
make up          # docker compose up -d (PostgreSQL only)
make migrate-up  # docker compose --profile migrate up migrate
```

The CI verifies the same `build → vet → test` and `lint` steps for both `admin` and `widget`.

## Code generation

- OpenAPI specs live in `api/openapi/v1/{service}/specs.yaml`
- `oapi-codegen` configs are in `api/openapi/v1/{service}/*.yaml` (split into `dto.yaml` and `server.yaml`)
- Generated Go output goes to `gen/rest/v1/go/{service}/`
- Generated TypeScript types go to `frontend/packages/api-client/src/generated/`
- After editing a spec, run `make rest-gen-admin` to regenerate both Go and TS

## Architecture

Clean architecture per service:

```
services/{name}/
  cmd/{name}/main.go         # entrypoint (stub)
  internal/
    config/                   # app configuration
    delivery/http/            # chi HTTP handlers + API mappers
    domain/                   # domain types
    infrastructure/           # DB, external adapters + mappers
    service/                  # business logic
  queries/
    sql/                      # raw query files (for sqlc)
    gen/                      # generated sqlc code
    sqlc.yaml                 # sqlc config
```

- Generated chi handler interfaces are implemented in `internal/delivery/http/handler.go`
- The `mapper.go` files follow a `// ENTITY = Domain / DTO` convention

## Database

- PostgreSQL, run via Docker Compose (`make up`)
- Migrations use `migrate/migrate` (`make migrate-up`)
- Migration files live in `migrations/postgres/`
- Schema: `project`, `scenario`, `scenario_version`, `step`, `event` with UUIDv7 PKs

## Environment

Copy `.env.example` to `.env` and adjust if needed. The `.gitignore` glob `*.env` excludes all `.env` files except `.env.example`.
