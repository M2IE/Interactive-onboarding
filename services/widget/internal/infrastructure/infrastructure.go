package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"

	repositories "github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/repository"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type WidgetInfrastructure struct {
	*repositories.ProjectRepository
	*repositories.ScenarioRepository
	*repositories.StepRepository
	*repositories.EventRepository
}

func NewWidgetInfrastructure(db database.Querier, q *queries.Query) *WidgetInfrastructure {
	return &WidgetInfrastructure{
		ProjectRepository:  repositories.NewProjectRepository(db, q),
		ScenarioRepository: repositories.NewScenarioRepository(db, q),
		StepRepository:     repositories.NewStepRepository(db, q),
		EventRepository:    repositories.NewEventRepository(db, q),
	}
}
