package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID         uuid.UUID
	Name       string
	ProjectKey string
	CreatedAt  time.Time
}

type Step struct {
	ID         uuid.UUID
	ScenarioID uuid.UUID
	OrderNum   int
	Selector   string
	Title      string
	Body       string
	NextURL    *string
}

var (
	ErrProjectNotFound         = errors.New("project not found")
	ErrNoPublishedScenario     = errors.New("no published scenario found")
	ErrStepNotFound            = errors.New("step not found")
	ErrMissingStepID           = errors.New("step_id is required for this event type")
	ErrMissingScenarioID       = errors.New("scenario_id is required for this event type")
	ErrMissingScenarioOrStepID = errors.New("either scenario_id or step_id must be provided")
	ErrInvalidEventType        = errors.New("invalid event type")
	ErrEventAlreadyExists      = errors.New("event already exists")
	ErrFlowNotFound            = errors.New("flow not found")
)
