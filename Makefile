help:
	@echo "Infrastructure:"
	@echo "  start           Full bootstrap: start containers + migrate + seed"
	@echo "  up              Start all containers + run migrations"
	@echo "  prune           Full teardown: remove containers and volumes (wipes DB)"
	@echo "  down            Stop all containers"
	@echo ""
	@echo "Database:"
	@echo "  migrate-up      Run all pending SQL migrations"
	@echo "  seed            Build and run seeder (demo scenarios + analytics events)"
	@echo ""
	@echo "Code generation:"
	@echo "  rest-gen-admin   Generate Go + TypeScript for Admin API"
	@echo "  rest-gen-widget  Generate Go + TypeScript for Widget API"
	@echo "  api-gen          Generate everything (admin + widget)"
	@echo ""

# up services and migrations
up:
	docker compose up -d
	make migrate-up

down:
	docker compose stop

# full up with migrations and seeds
start:
	make up
	make seed

# full delete
prune:
	docker compose down -v
	docker compose rm migrate seed -s -f

migrate-up:
	docker compose --profile migrate up migrate

seed:
	docker compose --profile seed up seed --build

rest-gen-admin-go:
	oapi-codegen -config api/openapi/v1/admin/dto.yaml api/openapi/v1/admin/specs.yaml
	oapi-codegen -config api/openapi/v1/admin/server.yaml api/openapi/v1/admin/specs.yaml

rest-gen-widget-go:
	oapi-codegen -config api/openapi/v1/widget/dto.yaml api/openapi/v1/widget/specs.yaml
	oapi-codegen -config api/openapi/v1/widget/server.yaml api/openapi/v1/widget/specs.yaml

rest-gen-admin-ts:
	npm --prefix frontend run api:generate:admin

rest-gen-widget-ts:
	npm --prefix frontend run api:generate:widget

rest-gen-admin:
	make rest-gen-admin-go
	make rest-gen-admin-ts

rest-gen-widget:
	make rest-gen-widget-go
	make rest-gen-widget-ts

api-gen:
	make rest-gen-admin
	make rest-gen-widget
