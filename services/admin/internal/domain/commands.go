package domain

import (
	"github.com/google/uuid"
)

type CreateScenario struct {
	Name      string
	ProjectID uuid.UUID
	Url       string
}

type UpdateScenario struct {
	Name *string
	Url  *string
}

type ListScenarios struct {
	ProjectID *uuid.UUID
	Size      int
	Page      int
}
