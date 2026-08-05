package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type ScenarioStatus string

const (
	ScenarioStatusDraft     ScenarioStatus = "draft"
	ScenarioStatusPublished ScenarioStatus = "published"
	ScenarioStatusArchived  ScenarioStatus = "archived"
)

var (
	ErrScenarioNotFound           = errors.New("scenario not found")
	ErrScenarioAlreadyPublished   = errors.New("scenario already published")
	ErrScenarioAlreadyUnpublished = errors.New("scenario already unpublished")
	ErrScenarioHasNoSteps         = errors.New("scenario has no steps")
)

type Scenario struct {
	ID        uuid.UUID
	ProjectID uuid.UUID
	Name      string
	URL       string
	Status    ScenarioStatus
	CreatedAt time.Time
	UpdatedAt time.Time
	VersionID uuid.UUID
	Version   int
	IsActive  bool
}
