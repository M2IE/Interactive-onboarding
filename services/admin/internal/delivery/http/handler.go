package http

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/publishes"
)

type IService interface {
	publishes.IPublishService
}

type Handler struct {
	*publishes.PublishHandler
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		PublishHandler: publishes.NewPublishHandler(s),
	}, nil)
}
