package service

import (
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/service/publishes"
)

type IInfrastructure interface {
	publishes.IPublishInfrastucture
}

type Service struct {
	*publishes.PublishService
}

func NewService(infra IInfrastructure, txManager database.Database) *Service {
	return &Service{
		publishes.NewPublshService(infra, txManager),
	}
}
