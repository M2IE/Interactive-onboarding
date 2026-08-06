package http

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/scenarios"
)

type IService interface {
	publishes.IPublishService
	scenarios.IScenarioService
}

type Handler struct {
	*publishes.PublishHandler
	*scenarios.ScenarioHandler
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		PublishHandler:  publishes.NewPublishHandler(s),
		ScenarioHandler: scenarios.NewScenarioHandler(s),
	}, nil)
}
