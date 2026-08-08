module github.com/M2IE/Interactive-onboarding/services/admin

go 1.26.5

replace (
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go => ../../gen/rest/v1/go
	github.com/M2IE/Interactive-onboarding/pkg/configs => ../../pkg/configs
	github.com/M2IE/Interactive-onboarding/pkg/database => ../../pkg/database
)

require (
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/configs v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/database v0.0.0-00010101000000-000000000000
	github.com/Masterminds/squirrel v1.5.4
	github.com/caarlos0/env/v11 v11.4.1
	github.com/go-chi/chi/v5 v5.3.1
	github.com/google/uuid v1.6.0
)

require (
	github.com/apapsch/go-jsonmerge/v2 v2.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.10.0 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/lann/builder v0.0.0-20180802200727-47ae307949d0 // indirect
	github.com/lann/ps v0.0.0-20150810152359-62de8c46ede0 // indirect
	github.com/oapi-codegen/runtime v1.6.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/text v0.40.0 // indirect
)
