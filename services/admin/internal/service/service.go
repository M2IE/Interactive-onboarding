package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/scenarios"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/steps"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	scenarios.IScenarioInfrastructure
	steps.IStepsInfrastructure
}

type Service struct {
	*publishes.PublishService
	*scenarios.ScenarioService
	*steps.StepsService
}

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		PublishService:  publishes.NewPublishService(infra, txManager),
		ScenarioService: scenarios.NewScenarioService(infra),
		StepsService:    steps.NewStepsService(infra, txManager),
	}
}
