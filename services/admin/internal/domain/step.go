package domain

import (
	"errors"

	"github.com/google/uuid"
)

type Step struct {
	ID         uuid.UUID
	ScenarioID uuid.UUID
	OrderNum   int
	Selector   string
	Title      string
	Body       string
	NextURL    *string
}

type ReorderItem struct {
	StepID   uuid.UUID
	NewOrder int
}

var (
	ErrStepNotFound      = errors.New("step not found")
	ErrScenarioPublished = errors.New("scenario is published and cannot be modified")
	ErrMissingSteps      = errors.New("not all steps provided for reorder")
	ErrDuplicateOrder    = errors.New("order numbers must be unique")
)
