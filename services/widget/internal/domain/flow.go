package domain

import (
	"time"

	"github.com/google/uuid"
)

type Flow struct {
	ID          uuid.UUID
	ProjectID   uuid.UUID
	Name        string
	Description *string
	FlowKey     string
	CreatedAt   time.Time
}

type FlowScenarioDetail struct {
	ScenarioID uuid.UUID
	OrderNum   int
	Name       string
	URL        string
	Status     ScenarioStatus
	StepCount  int
}
