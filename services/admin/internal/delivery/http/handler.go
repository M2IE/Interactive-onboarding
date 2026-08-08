package http

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/publishes"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/steps"
)

type IService interface {
	publishes.IPublishService
	steps.IStepsService
}

type Handler struct {
	*publishes.PublishHandler
	*steps.StepsHandler
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		PublishHandler: publishes.NewPublishHandler(s), StepsHandler: steps.NewStepsHandler(s),
	}, nil)
}
