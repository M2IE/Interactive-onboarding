package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/steps"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	steps.IStepsInfrastructure
}

type Service struct {
	*publishes.PublishService
	*steps.StepsService
}

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		publishes.NewPublishService(infra, txManager),
		steps.NewStepsService(infra, txManager),
	}
}
