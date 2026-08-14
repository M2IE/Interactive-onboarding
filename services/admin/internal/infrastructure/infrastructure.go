package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/flows"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/projects"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/scenarios"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/steps"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

type Infrastructure struct {
	*publishes.PublishInfrastructure
	*analytics.AnalyticsInfrastructure
	*scenarios.ScenarioInfrastructure
	*steps.StepsInfrastructure
	*projects.ProjectInfrastructure
	*flows.FlowInfrastructure
}

func NewInfrastructure(db rdb.Database, q *queries.Query, ch olap.Database, s3 s3.Client, pdf pdfengine.Engine, s3ReportBucket string) *Infrastructure {
	return &Infrastructure{
		PublishInfrastructure:   publishes.NewPublishInfrastructure(db, q),
		AnalyticsInfrastructure: analytics.NewAnalyticsInfrastructure(db, q, ch, s3, pdf, s3ReportBucket),
		StepsInfrastructure:     steps.NewStepsInfrastructure(db, q),
		ScenarioInfrastructure:  scenarios.NewScenarioInfrastructure(db, q),
		ProjectInfrastructure:   projects.NewProjectInfrastructure(db, q),
		FlowInfrastructure:      flows.NewFlowInfrastructure(db, q),
	}
}
