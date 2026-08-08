package steps

import (
	"context"
	"errors"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IStepsService interface {
	CreateStep(ctx context.Context, scenarioID uuid.UUID, selector, title, body string) (*domain.Step, error)
	UpdateStep(ctx context.Context, stepID uuid.UUID, selector, title, body *string) (*domain.Step, error)
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
	step, err := h.service.CreateStep(ctx, scenarioID, request.Body.Selector, request.Body.Title, request.Body.Body)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.CreateStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioPublished):
			return apiv1.CreateStep422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
			}, nil
		default:
			return nil, err // 500
		}
	}

	return apiv1.CreateStep201JSONResponse(ToDTOStep(step)), nil
}

// Reorder steps
// (PUT /admin/scenarios/{id}/steps/order)
func (h StepsHandler) ReorderSteps(ctx context.Context, request apiv1.ReorderStepsRequestObject) (apiv1.ReorderStepsResponseObject, error) {
	// Парсим scenarioID из пути
	scenarioID, err := uuid.Parse(request.Id.String())
	if err != nil {
		return apiv1.ReorderSteps422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid scenario id"},
		}, nil
	}

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

	err = h.service.ReorderSteps(ctx, scenarioID, items)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.ReorderSteps404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioPublished):
			return apiv1.ReorderSteps422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrStepNotFound):
			return apiv1.ReorderSteps404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrDuplicateOrder), errors.Is(err, domain.ErrMissingSteps):
			return apiv1.ReorderSteps422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.STEPORDERCONFLICT, Message: err.Error()},
			}, nil
		default:
			return nil, err
		}
	}

	return apiv1.ReorderSteps204Response{}, nil
}

// Delete step
// (DELETE /admin/scenarios/{id}/steps/{stepId})
func (h StepsHandler) DeleteStep(ctx context.Context, request apiv1.DeleteStepRequestObject) (apiv1.DeleteStepResponseObject, error) {
	stepID, err := uuid.Parse(request.StepId.String())
	if err != nil {
		return apiv1.DeleteStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid step id"},
		}, nil
	}

	err = h.service.DeleteStep(ctx, stepID)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrStepNotFound):
			return apiv1.DeleteStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.DeleteStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioPublished):
			// В спецификации нет 422, используем 404 с кодом конфликта
			return apiv1.DeleteStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
			}, nil
		default:
			return nil, err // 500
		}
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

	step, err := h.service.UpdateStep(ctx, stepID, request.Body.Selector, request.Body.Title, request.Body.Body)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrStepNotFound):
			return apiv1.UpdateStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.UpdateStep404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioPublished):
			return apiv1.UpdateStep422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
			}, nil
		default:
			return nil, err
		}
	}

	return apiv1.UpdateStep200JSONResponse(ToDTOStep(step)), nil
}
