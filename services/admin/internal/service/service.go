package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	analytics.IAnalyticsInfrastructure
}

type Service struct {
	*publishes.PublishService
	*analytics.AnalyticsService
}

func NewService(infra IInfrastructure, txManager database.Database, s3Client s3.Client, pdfEngine pdfengine.Engine, bucket string) *Service {
	return &Service{
		publishes.NewPublishService(infra, txManager),
		analytics.NewAnalyticsService(infra, txManager, s3Client, pdfEngine, bucket),
	}
}
