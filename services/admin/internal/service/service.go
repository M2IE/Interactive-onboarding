package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/flows"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/projects"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/scenarios"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/steps"
)

type IInfrastructure interface {
	publishes.IPublishInfrastructure
	analytics.IAnalyticsInfrastructure
	scenarios.IScenarioInfrastructure
	steps.IStepsInfrastructure
	projects.IProjectInfrastructure
	flows.IFlowInfrastructure
}

type Service struct {
	*publishes.PublishService
	*analytics.AnalyticsService
	*scenarios.ScenarioService
	*steps.StepsService
	*projects.ProjectService
	*flows.FlowService
}

func NewService(infra IInfrastructure, txManager rdb.Database) *Service {
	return &Service{
		AnalyticsService: analytics.NewAnalyticsService(infra, txManager),
		PublishService:   publishes.NewPublishService(infra, txManager),
		ScenarioService:  scenarios.NewScenarioService(infra),
		StepsService:     steps.NewStepsService(infra, txManager),
		ProjectService:   projects.NewProjectService(infra),
		FlowService:      flows.NewFlowsService(infra, txManager),
	}
}
