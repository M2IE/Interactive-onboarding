package projects

import (
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
)

func toDomainProject(row *gen.Project) *domain.Project {
	if row == nil {
		return nil
	}

	return &domain.Project{
		ID:         row.ID,
		Name:       row.Name,
		ProjectKey: row.ProjectKey,
		CreatedAt:  row.CreatedAt,
	}
}
