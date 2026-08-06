package domain

import (
	"github.com/google/uuid"
)

type CreateScenario struct {
	Name      string
	ProjectId uuid.UUID
	Url       string
}

type UpdateScenario struct {
	Name *string
	Url  *string
}
