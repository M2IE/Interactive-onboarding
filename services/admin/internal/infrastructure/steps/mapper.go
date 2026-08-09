package steps

import (
	"database/sql"

	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
)

// toDomainStep преобразует gen.Step в domain.Step
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

// toGenCreateStepParams преобразует domain.Step в gen.CreateStepParams
func toGenCreateStepParams(step *domain.Step) gen.CreateStepParams {
	return gen.CreateStepParams{
		ID:         step.ID,
		ScenarioID: step.ScenarioID,
		OrderNum:   int32(step.OrderNum),
		Selector:   step.Selector,
		Title:      step.Title,
		Body:       step.Body,
		NextUrl:    toNullString(step.NextURL),
	}
}

// toGenUpdateStepParams преобразует domain.Step в gen.UpdateStepParams
func toGenUpdateStepParams(step *domain.Step) gen.UpdateStepParams {
	return gen.UpdateStepParams{
		ID:       step.ID,
		Selector: step.Selector,
		Title:    step.Title,
		Body:     step.Body,
		NextUrl:  toNullString(step.NextURL),
	}
}

func toNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}

	return sql.NullString{String: *value, Valid: true}
}
