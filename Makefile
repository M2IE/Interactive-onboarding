
up:
	docker compose up -d

migrate-up:
	docker compose --profile migrate up migrate

rest-gen-admin-go:
	oapi-codegen -config api/openapi/v1/admin/dto.yaml api/openapi/v1/admin/specs.yaml
	oapi-codegen -config api/openapi/v1/admin/server.yaml api/openapi/v1/admin/specs.yaml

rest-gen-admin-ts:
	npx openapi-typescript api/openapi/v1/admin/specs.yaml -o gen/rest/v1/ts/admin/admin.ts

rest-gen-admin:
	make rest-gen-admin-go
	make rest-gen-admin-ts

api-gen:
	make rest-gen-admin
