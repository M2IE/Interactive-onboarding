package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"

	clickhouse "github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/event_clickhouse"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/flows"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/projects"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/scenarios"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/infrastructure/steps"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type WidgetInfrastructure struct {
	*projects.ProjectRepository
	*scenarios.ScenarioRepository
	*steps.StepRepository
	*clickhouse.EventRepository
	*flows.FlowRepository
}

func NewWidgetInfrastructure(db rdb.Database, q *queries.Query, chConn olap.Database) *WidgetInfrastructure {
	return &WidgetInfrastructure{
		ProjectRepository:  projects.NewProjectRepository(db, q),
		ScenarioRepository: scenarios.NewScenarioRepository(db, q),
		StepRepository:     steps.NewStepRepository(db, q),
		EventRepository:    clickhouse.NewEventRepository(chConn, q),
		FlowRepository:     flows.NewFlowRepository(db, q),
	}
}
