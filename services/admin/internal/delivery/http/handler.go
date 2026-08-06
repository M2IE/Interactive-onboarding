package http

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/analytics"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/publishes"
)

type IService interface {
	publishes.IPublishService
	analytics.IAnalyticsService
}

type Handler struct {
	*publishes.PublishHandler
	*analytics.AnalyticsHandler
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		PublishHandler:   publishes.NewPublishHandler(s),
		AnalyticsHandler: analytics.NewAnalitics(s),
	}, nil)
}
