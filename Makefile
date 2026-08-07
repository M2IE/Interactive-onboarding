
up:
	docker compose up -d

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
	npx openapi-typescript api/openapi/v1/admin/specs.yaml -o gen/rest/v1/ts/admin/admin.ts

rest-gen-widget-ts:
	npx openapi-typescript api/openapi/v1/widget/specs.yaml -o gen/rest/v1/ts/widget/widget.ts

rest-gen-admin:
	make rest-gen-admin-go
	make rest-gen-admin-ts

rest-gen-widget:
	make rest-gen-widget-go
	make rest-gen-widget-ts

api-gen:
	make rest-gen-admin
	make rest-gen-widget
