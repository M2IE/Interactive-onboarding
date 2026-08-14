package domain

import (
	"errors"
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

type FlowScenario struct {
	FlowID     uuid.UUID
	ScenarioID uuid.UUID
	OrderNum   int
}

type ReorderFlowItem struct {
	ScenarioID uuid.UUID
	OrderNum   int
}

type FlowScenarioDetail struct {
	ScenarioID uuid.UUID
	OrderNum   int
	Name       string
	URL        string
	Status     ScenarioStatus
}

type FlowWithScenarios struct {
	Flow
	Scenarios []FlowScenarioDetail
}

var (
	ErrFlowNotFound          = errors.New("flow not found")
	ErrFlowKeyExists         = errors.New("flow key already exists in this project")
	ErrScenarioNotInFlow     = errors.New("scenario not in flow")
	ErrScenarioAlreadyInFlow = errors.New("scenario already in flow")
	ErrInvalidOrder          = errors.New("invalid order number")
)
