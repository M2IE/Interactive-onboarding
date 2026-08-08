module github.com/M2IE/Interactive-onboarding/services/admin

go 1.26.5

replace (
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go => ../../gen/rest/v1/go
	github.com/M2IE/Interactive-onboarding/pkg/configs => ../../pkg/configs
	github.com/M2IE/Interactive-onboarding/pkg/database => ../../pkg/database
	github.com/M2IE/Interactive-onboarding/pkg/pdfengine => ../../pkg/pdfengine
	github.com/M2IE/Interactive-onboarding/pkg/s3 => ../../pkg/s3
)

require (
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/configs v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/database v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/pdfengine v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/s3 v0.0.0-00010101000000-000000000000
	github.com/Masterminds/squirrel v1.5.4
	github.com/aws/aws-sdk-go-v2/service/s3 v1.106.5
	github.com/caarlos0/env/v11 v11.4.1
	github.com/go-chi/chi/v5 v5.3.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.10.0
)

require (
	github.com/apapsch/go-jsonmerge/v2 v2.0.0 // indirect
	github.com/aws/aws-sdk-go-v2 v1.43.4 // indirect
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.7.16 // indirect
	github.com/aws/aws-sdk-go-v2/credentials v1.19.34 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.4.35 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.7.35 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.4.36 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.13.15 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.9.28 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.13.35 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.19.36 // indirect
	github.com/aws/smithy-go v1.27.6 // indirect
	github.com/gpdf-dev/gpdf v1.0.11 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/lann/builder v0.0.0-20180802200727-47ae307949d0 // indirect
	github.com/lann/ps v0.0.0-20150810152359-62de8c46ede0 // indirect
	github.com/oapi-codegen/runtime v1.6.0 // indirect
	github.com/phpdave11/gofpdi v1.0.14-0.20211212211723-1f10f9844311 // indirect
	github.com/pkg/errors v0.8.1 // indirect
	github.com/signintech/gopdf v0.38.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/text v0.40.0 // indirect
)
