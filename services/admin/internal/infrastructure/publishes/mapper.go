package publishes

import (
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

// ENTITY = Domain / DB

func toDomainScenario(row *gen.GetScenarioRow) *domain.Scenario {
	if row == nil {
		return nil
	}
	return &domain.Scenario{
		ID:        row.ID,
		ProjectID: row.ProjectID,
		Name:      row.Name,
		URL:       row.Url,
		Status:    domain.ScenarioStatus(row.Status),
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
		VersionID: row.VersionID,
		Version:   int(row.Version),
		IsActive:  row.IsActive,
	}
}

func toGenUpdateStatusParams(id uuid.UUID, status domain.ScenarioStatus) gen.UpdateScenarioStatusParams {
	return gen.UpdateScenarioStatusParams{
		ID:     id,
		Status: gen.ScenarioStatus(status),
	}
}
