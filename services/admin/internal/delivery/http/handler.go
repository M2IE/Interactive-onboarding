package http

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
)

type IService interface {
}

type Handler struct {
	service IService
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		service: s,
	}, nil)
}
