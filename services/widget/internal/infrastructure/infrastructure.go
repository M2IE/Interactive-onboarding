package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"

	repositories "github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/repository"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type WidgetInfrastructure struct {
	*repositories.ProjectRepository
	*repositories.ScenarioRepository
	*repositories.StepRepository
	*repositories.EventClickHouseRepository
}

func NewWidgetInfrastructure(db rdb.Querier, q *queries.Query, chConn olap.Database) *WidgetInfrastructure {
	return &WidgetInfrastructure{
		ProjectRepository:         repositories.NewProjectRepository(db, q),
		ScenarioRepository:        repositories.NewScenarioRepository(db, q),
		StepRepository:            repositories.NewStepRepository(db, q),
		EventClickHouseRepository: repositories.NewEventClickHouseRepository(chConn),
	}
}
