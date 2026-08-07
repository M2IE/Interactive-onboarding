package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
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

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		publishes.NewPublishService(infra, txManager),
		analytics.NewAnalyticsService(infra, txManager),
	}
}
