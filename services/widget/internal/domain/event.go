package domain

import (
	"time"

	"github.com/google/uuid"
)

type EventType string

const (
	StepViewed        EventType = "step_viewed"
	StepCompleted     EventType = "step_completed"
	ScenarioCompleted EventType = "scenario_completed"
	ScenarioDismissed EventType = "scenario_dismissed"
)

type Event struct {
	ID         uuid.UUID
	ProjectID  uuid.UUID
	ScenarioID *uuid.UUID
	StepID     *uuid.UUID
	SessionID  string
	Type       EventType
	EventKey   string
	CreatedAt  time.Time
}
