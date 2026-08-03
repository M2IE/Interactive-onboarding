package http

type IService interface {
}

type Handler struct {
	service IService
}

func NewHandler(s IService) *Handler {
	return &Handler{service: s}
}
