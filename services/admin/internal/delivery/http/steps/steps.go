package steps

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IStepsService interface {
	CreateStep(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, nextURL *string) (*domain.Step, error)
	UpdateStep(ctx context.Context, stepID uuid.UUID, selector, title, body *string, nextURL *string) (*domain.Step, error)
	DeleteStep(ctx context.Context, stepID uuid.UUID) error
	ReorderSteps(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error
}

type StepsHandler struct {
	service IStepsService
}

func NewStepsHandler(service IStepsService) *StepsHandler {
	return &StepsHandler{service: service}
}

// Create step
// (POST /admin/scenarios/{id}/steps)
func (h StepsHandler) CreateStep(ctx context.Context, request apiv1.CreateStepRequestObject) (apiv1.CreateStepResponseObject, error) {
	scenarioID, err := uuid.Parse(request.Id.String())
	if err != nil {
		return apiv1.CreateStep422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid scenario id"},
		}, nil
	}

	// Вызываем сервис
	step, err := h.service.CreateStep(ctx, scenarioID, request.Body.Selector, request.Body.Title, request.Body.Body, request.Body.NextUrl)
	if err != nil {
		return ToCreateStepErrorResponse(err), nil
	}

	return apiv1.CreateStep201JSONResponse(ToDTOStep(step)), nil
}

// Reorder steps
// (PUT /admin/scenarios/{id}/steps/order)
func (h StepsHandler) ReorderSteps(ctx context.Context, request apiv1.ReorderStepsRequestObject) (apiv1.ReorderStepsResponseObject, error) {
	// Преобразуем DTO в доменные объекты
	items, err := ToDomainReorderItems(request.Body.Order)
	if err != nil {
		return apiv1.ReorderSteps422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid step id in reorder list"},
		}, nil
	}

	err = h.service.ReorderSteps(ctx, request.Id, items)
	if err != nil {
		return ToReorderStepsErrorResponse(err), nil
	}

	return apiv1.ReorderSteps204Response{}, nil
}

// Delete step
// (DELETE /admin/scenarios/{id}/steps/{stepId})
func (h StepsHandler) DeleteStep(ctx context.Context, request apiv1.DeleteStepRequestObject) (apiv1.DeleteStepResponseObject, error) {
	if err := h.service.DeleteStep(ctx, request.StepId); err != nil {
		return ToDeleteStepErrorResponse(err), nil
	}

	return apiv1.DeleteStep204Response{}, nil
}

// Update step
// (PATCH /admin/scenarios/{id}/steps/{stepId})
func (h StepsHandler) UpdateStep(ctx context.Context, request apiv1.UpdateStepRequestObject) (apiv1.UpdateStepResponseObject, error) {
	stepID, err := uuid.Parse(request.StepId.String())
	if err != nil {
		return apiv1.UpdateStep422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid step id"},
		}, nil
	}

	step, err := h.service.UpdateStep(ctx, stepID, request.Body.Selector, request.Body.Title, request.Body.Body, request.Body.NextUrl)
	if err != nil {
		return ToUpdateStepErrorResponse(err), nil
	}

	return apiv1.UpdateStep200JSONResponse(ToDTOStep(step)), nil
}
