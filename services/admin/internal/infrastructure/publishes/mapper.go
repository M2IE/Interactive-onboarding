package publishes

import (
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

// ENTITY = Domain / DB

func toDomainScenario(row *gen.Scenario) *domain.Scenario {
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
	}
}

func toGenCreateScenarioParams(projectID uuid.UUID, name, url string, status domain.ScenarioStatus) gen.CreateScenarioParams {
	return gen.CreateScenarioParams{
		ProjectID: projectID,
		Name:      name,
		Url:       url,
		Status:    gen.ScenarioStatus(status),
	}
}

func toGenUpdateStatusParams(id uuid.UUID, status domain.ScenarioStatus) gen.UpdateScenarioStatusByIdParams {
	return gen.UpdateScenarioStatusByIdParams{
		ID:     id,
		Status: gen.ScenarioStatus(status),
	}
}

func toGenArchiveParams(projectID uuid.UUID, status domain.ScenarioStatus, url string) gen.ArchiveByProjectAndStatusParams {
	return gen.ArchiveByProjectAndStatusParams{
		ProjectID: projectID,
		Status:    gen.ScenarioStatus(status),
		Url:       url,
	}
}

func toGenCopyStepsParams(destScenarioID, srcScenarioID uuid.UUID) gen.CopyStepsToScenarioParams {
	return gen.CopyStepsToScenarioParams{
		DestScenarioID: destScenarioID,
		SrcScenarioID:  srcScenarioID,
	}
}
