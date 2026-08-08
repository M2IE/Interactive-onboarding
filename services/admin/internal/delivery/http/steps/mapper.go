package steps

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

// ToDTOStep - преобразует domain.Step в apiv1.Step.
func ToDTOStep(s *domain.Step) apiv1.Step {
	return apiv1.Step{
		Id:       s.ID,
		OrderNum: s.OrderNum,
		Selector: s.Selector,
		Title:    s.Title,
		Body:     s.Body,
	}
}

// ToDomainReorderItems - преобразует DTO из запроса в []domain.ReorderItem.
func ToDomainReorderItems(items []apiv1.StepOrder) ([]domain.ReorderItem, error) {
	result := make([]domain.ReorderItem, len(items))
	for i, item := range items {
		stepID, err := uuid.Parse(item.StepId.String())
		if err != nil {
			return nil, err
		}
		result[i] = domain.ReorderItem{
			StepID:   stepID,
			NewOrder: item.OrderNum,
		}
	}
	return result, nil
}
