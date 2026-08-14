package projects

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

type IProjectInfrastructure interface {
	GetByKey(ctx context.Context, db rdb.Querier, projectKey string) (*domain.Project, error)
}

type ProjectService struct {
	infra IProjectInfrastructure
}

func NewProjectService(infra IProjectInfrastructure) *ProjectService {
	return &ProjectService{
		infra: infra,
	}
}

func (s *ProjectService) GetByKey(ctx context.Context, projectKey string) (*domain.Project, error) {
	return s.infra.GetByKey(ctx, nil, projectKey)
}
