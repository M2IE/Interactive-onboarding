module github.com/M2IE/Interactive-onboarding/services/widget

go 1.26.5

replace(
    github.com/M2IE/Interactive-onboarding/pkg/configs => ../../pkg/configs
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget => ../../gen/rest/v1/go
	github.com/M2IE/Interactive-onboarding/pkg/database => ../../pkg/database
)

require (
	github.com/Masterminds/squirrel v1.5.4
	github.com/caarlos0/env/v11 v11.4.1
	github.com/google/uuid v1.6.0
	github.com/M2IE/Interactive-onboarding/pkg/configs v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget v0.0.0-00010101000000-000000000000
	github.com/M2IE/Interactive-onboarding/pkg/database v0.0.0-00010101000000-000000000000
)

require (
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/lann/builder v0.0.0-20180802200727-47ae307949d0 // indirect
	github.com/lann/ps v0.0.0-20150810152359-62de8c46ede0 // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/stretchr/testify v1.11.1 // indirect
)
