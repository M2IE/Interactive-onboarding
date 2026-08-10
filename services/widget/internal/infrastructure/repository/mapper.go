package repositories

import (
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
)

func toDomainProject(row *gen.Project) *domain.Project {
	return &domain.Project{
		ID:         row.ID,
		Name:       row.Name,
		ProjectKey: row.ProjectKey,
		CreatedAt:  row.CreatedAt,
	}
}

func toDomainScenario(row *gen.Scenario) *domain.Scenario {
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

func toDomainStep(row *gen.Step) *domain.Step {
	var nextURL *string
	if row.NextUrl.Valid {
		nextURL = &row.NextUrl.String
	}
	return &domain.Step{
		ID:         row.ID,
		ScenarioID: row.ScenarioID,
		OrderNum:   int(row.OrderNum),
		Selector:   row.Selector,
		Title:      row.Title,
		Body:       row.Body,
		NextURL:    nextURL,
	}
}
