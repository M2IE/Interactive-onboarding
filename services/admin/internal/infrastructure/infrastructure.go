package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/scenarios"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

type Infrastructure struct {
	*publishes.PublishInfrastructure
	*scenarios.ScenarioInfrastructure
}

func NewInfrastructure(db database.Database, q *queries.Query) *Infrastructure {
	return &Infrastructure{
		PublishInfrastructure:  publishes.NewPublishInfrastructure(db, q),
		ScenarioInfrastructure: scenarios.NewScenarioInfrastructure(db, q),
	}
}
