package http

import (
	"context"
	"errors"
	"log/slog"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/google/uuid"
)

type IWidgetService interface {
	GetScenario(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, error)
	ProcessEvent(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error
}
type WidgetHandler struct {
	service IWidgetService
}

func NewWidgetHandler(service IWidgetService) *WidgetHandler {
	return &WidgetHandler{service: service}
}

// GetWidgetScenario обрабатывает GET /widget/scenario.
func (h *WidgetHandler) GetWidgetScenario(ctx context.Context, request apiv1.GetWidgetScenarioRequestObject) (apiv1.GetWidgetScenarioResponseObject, error) {
	projectKey := request.Params.ProjectKey
	pageUrl := request.Params.PageUrl

	scenario, steps, err := h.service.GetScenario(ctx, projectKey, pageUrl)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrProjectNotFound):
			return apiv1.GetWidgetScenario404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: "PROJECT_NOT_FOUND", Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrNoPublishedScenario):
			return apiv1.GetWidgetScenario204Response{}, nil
		default:
			slog.Error("get widget scenario: internal error", "error", err)
			return apiv1.GetWidgetScenario500JSONResponse{Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: "INTERNAL_ERROR", Message: "internal server error"}}, nil
		}
	}

	// Преобразуем шаги в DTO
	stepDTOs := make([]apiv1.Step, len(steps))
	for i, st := range steps {
		stepDTOs[i] = apiv1.Step{
			Id:       st.ID,
			OrderNum: st.OrderNum,
			Selector: st.Selector,
			Title:    st.Title,
			Body:     st.Body,
			NextUrl:  st.NextURL,
		}
	}

	return apiv1.GetWidgetScenario200JSONResponse{
		Scenario: &apiv1.Scenario{
			Id:    scenario.ID,
			Name:  scenario.Name,
			Steps: stepDTOs,
		},
	}, nil
}

// PostWidgetEvent обрабатывает POST /widget/event.
func (h *WidgetHandler) PostWidgetEvent(ctx context.Context, request apiv1.PostWidgetEventRequestObject) (apiv1.PostWidgetEventResponseObject, error) {
	body := request.Body
	if body == nil {
		return apiv1.PostWidgetEvent400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: "INVALID_BODY", Message: "missing request body"},
		}, nil
	}

	if body.SessionId == [16]byte{} || body.Type == "" {
		return apiv1.PostWidgetEvent400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: "INVALID_BODY", Message: "session_id and type are required"},
		}, nil
	}

	eventType := domain.EventType(body.Type)
	if !isValidEventType(eventType) {
		return apiv1.PostWidgetEvent422JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: "INVALID_EVENT_TYPE", Message: "unsupported event type"},
		}, nil
	}

	var stepID, scenarioID *uuid.UUID

	if body.StepId != nil {
		id, err := uuid.Parse(body.StepId.String())
		if err != nil {
			return apiv1.PostWidgetEvent422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: "INVALID_PARAMETER", Message: "invalid step_id format"},
			}, nil
		}
		stepID = &id
	}

	if body.ScenarioId != nil {
		id, err := uuid.Parse(body.ScenarioId.String())
		if err != nil {
			return apiv1.PostWidgetEvent422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: "INVALID_PARAMETER", Message: "invalid scenario_id format"},
			}, nil
		}
		scenarioID = &id
	}

	sessionID := body.SessionId.String()
	err := h.service.ProcessEvent(ctx, sessionID, eventType, stepID, scenarioID, body.EventKey)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrMissingStepID), errors.Is(err, domain.ErrMissingScenarioID):
			return apiv1.PostWidgetEvent422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: "MISSING_REQUIRED_FIELD", Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.PostWidgetEvent404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: "SCENARIO_NOT_FOUND", Message: err.Error()},
			}, nil
		default:
			slog.Error("post widget event: internal error", "error", err)
			return apiv1.PostWidgetEvent500JSONResponse{Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: "INTERNAL_ERROR", Message: "internal server error"}}, nil
		}
	}

	return apiv1.PostWidgetEvent204Response{}, nil
}

// isValidEventType проверяет допустимость типа события.
func isValidEventType(t domain.EventType) bool {
	switch t {
	case domain.StepViewed, domain.StepCompleted, domain.ScenarioDismissed:
		return true
	default:
		return false
	}
}
