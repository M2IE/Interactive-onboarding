package scenarios

import (
	"database/sql"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

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

func toDomainListScenarios(rows []gen.ListScenariosRow) ([]domain.Scenario, int64) {
	if len(rows) == 0 {
		return []domain.Scenario{}, 0
	}

	total := rows[0].TotalCount
	scenarios := make([]domain.Scenario, 0)
	for _, row := range rows {
		scenarios = append(scenarios, domain.Scenario{
			ID:        row.ID,
			ProjectID: row.ProjectID,
			Name:      row.Name,
			URL:       row.Url,
			Status:    domain.ScenarioStatus(row.Status),
			CreatedAt: row.CreatedAt,
			UpdatedAt: row.UpdatedAt,
		})
	}

	return scenarios, total
}

func toDomainStep(row *gen.Step) *domain.Step {
	if row == nil {
		return nil
	}

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

func toDomainSteps(rows []gen.Step) []domain.Step {
	steps := make([]domain.Step, 0, len(rows))
	for i := range rows {
		steps = append(steps, *toDomainStep(&rows[i]))
	}

	return steps
}

func toGenCreateScenarioParams(projectID uuid.UUID, name, url string, status domain.ScenarioStatus) gen.CreateScenarioParams {
	return gen.CreateScenarioParams{
		ProjectID: projectID,
		Name:      name,
		Url:       url,
		Status:    gen.ScenarioStatus(status),
	}
}

func toGenUpdateScenarioParams(id uuid.UUID, name, url *string) gen.UpdateScenarioParams {
	params := gen.UpdateScenarioParams{
		ID: id,
	}

	if name != nil {
		params.Name = sql.NullString{String: *name, Valid: true}
	}

	if url != nil {
		params.Url = sql.NullString{String: *url, Valid: true}
	}

	return params
}

func toGenListScenarioParams(offset, limit int, projectID *uuid.UUID) gen.ListScenariosParams {
	params := gen.ListScenariosParams{
		Offset: int32(offset),
		Limit:  int32(limit),
	}

	if projectID != nil {
		params.ProjectID = uuid.NullUUID{UUID: *projectID, Valid: true}
	}

	return params
}
