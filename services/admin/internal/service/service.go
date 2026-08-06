package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/scenarios"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	scenarios.IScenarioInfrastructure
}

type Service struct {
	*publishes.PublishService
	*scenarios.ScenarioService
}

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		publishes.NewPublishService(infra, txManager),
		scenarios.NewScenarioService(infra),
	}
}
