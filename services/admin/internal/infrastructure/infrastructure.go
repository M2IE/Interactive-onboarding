package infrastructure

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/infrastructure/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

type Infrastructure struct {
	*publishes.PublishInfrastructure
	*analytics.AnalyticsInfrastructure
}

func NewInfrastructure(db database.Database, q *queries.Query, s3 s3.Client, pdf pdfengine.Engine, s3ReportBucket string) *Infrastructure {
	return &Infrastructure{
		PublishInfrastructure:   publishes.NewPublishInfrastructure(db, q),
		AnalyticsInfrastructure: analytics.NewAnalyticsInfrastructure(db, q, s3, pdf, s3ReportBucket),
	}
}
