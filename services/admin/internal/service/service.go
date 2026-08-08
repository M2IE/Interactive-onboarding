package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/steps"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	analytics.IAnalyticsInfrastructure
	steps.IStepsInfrastructure
}

type Service struct {
	*publishes.PublishService
	*analytics.AnalyticsService
	*steps.StepsService
}

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		publishes.NewPublishService(infra, txManager),
		analytics.NewAnalyticsService(infra, txManager),
		steps.NewStepsService(infra, txManager),
	}
}
