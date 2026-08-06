package steps

import (
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
)

// toDomainStep преобразует gen.Step в domain.Step
func toDomainStep(row *gen.Step) *domain.Step {
	if row == nil {
		return nil
	}
	return &domain.Step{
		ID:         row.ID,
		ScenarioID: row.ScenarioID,
		OrderNum:   int(row.OrderNum),
		Selector:   row.Selector,
		Title:      row.Title,
		Body:       row.Body,
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
	}
}

// toGenUpdateStepParams преобразует domain.Step в gen.UpdateStepParams
func toGenUpdateStepParams(step *domain.Step) gen.UpdateStepParams {
	return gen.UpdateStepParams{
		ID:       step.ID,
		Selector: step.Selector,
		Title:    step.Title,
		Body:     step.Body,
	}
}
