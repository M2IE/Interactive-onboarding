package steps

import (
	"errors"
	"log/slog"

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

func ToCreateStepErrorResponse(err error) apiv1.CreateStepResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.CreateStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioPublished):
		return apiv1.CreateStep422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("create step: internal error", "error", err)
		return apiv1.CreateStep500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode "json:\"code\""
				Message string                               "json:\"message\""
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}

func ToReorderStepsErrorResponse(err error) apiv1.ReorderStepsResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.ReorderSteps404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioPublished):
		return apiv1.ReorderSteps422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrStepNotFound):
		return apiv1.ReorderSteps404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrDuplicateOrder), errors.Is(err, domain.ErrMissingSteps):
		return apiv1.ReorderSteps422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.STEPORDERCONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("reorder steps: internal error", "error", err)
		return apiv1.ReorderSteps500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode "json:\"code\""
				Message string                               "json:\"message\""
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}

func ToDeleteStepErrorResponse(err error) apiv1.DeleteStepResponseObject {
	switch {
	case errors.Is(err, domain.ErrStepNotFound):
		return apiv1.DeleteStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.DeleteStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioPublished):
		return apiv1.DeleteStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("delete step: internal error", "error", err)
		return apiv1.DeleteStep500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode "json:\"code\""
				Message string                               "json:\"message\""
			}{
				Code:    apiv1.INTERNALERROR,
				Message: "internal server error",
			},
		}
	}
}

func ToUpdateStepErrorResponse(err error) apiv1.UpdateStepResponseObject {
	switch {
	case errors.Is(err, domain.ErrStepNotFound):
		return apiv1.UpdateStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.STEPNOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.UpdateStep404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioPublished):
		return apiv1.UpdateStep422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("update step: internal error", "error", err)
		return apiv1.UpdateStep500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode "json:\"code\""
				Message string                               "json:\"message\""
			}{
				Code:    apiv1.INTERNALERROR,
				Message: "internal server error",
			},
		}
	}
}
