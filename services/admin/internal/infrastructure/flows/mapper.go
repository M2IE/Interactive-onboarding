package flows

import (
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
)

func toDomainFlow(row *gen.Flow) *domain.Flow {
	var description *string
	if row.Description.Valid {
		description = &row.Description.String
	}
	return &domain.Flow{
		ID:          row.ID,
		ProjectID:   row.ProjectID,
		Name:        row.Name,
		Description: description,
		FlowKey:     row.FlowKey,
		CreatedAt:   row.CreatedAt,
	}
}

func toDomainFlowScenario(row *gen.GetFlowScenariosRow) domain.FlowScenario {
	return domain.FlowScenario{
		FlowID:     row.FlowID,
		ScenarioID: row.ScenarioID,
		OrderNum:   int(row.OrderNum),
	}
}
