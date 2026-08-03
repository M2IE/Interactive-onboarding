package service

type IInfrastructure interface {
}

type Service struct {
	repository IInfrastructure
}

func NewService(r IInfrastructure) *Service {
	return &Service{repository: r}
}
