package infrastructure

import (
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/M2IE/Interactive-onboarding/pkg/database"

	repositories "github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/repository"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type WidgetInfrastructure struct {
	*repositories.ProjectRepository
	*repositories.ScenarioRepository
	*repositories.StepRepository
	*repositories.EventClickHouseRepository
}

func NewWidgetInfrastructure(db database.Querier, q *queries.Query, chConn driver.Conn) *WidgetInfrastructure {
	return &WidgetInfrastructure{
		ProjectRepository:         repositories.NewProjectRepository(db, q),
		ScenarioRepository:        repositories.NewScenarioRepository(db, q),
		StepRepository:            repositories.NewStepRepository(db, q),
		EventClickHouseRepository: repositories.NewEventClickHouseRepository(chConn, q),
	}
}
