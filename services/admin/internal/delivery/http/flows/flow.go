package flows

import (
	"context"
	"errors"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IFlowService interface {
	CreateFlow(ctx context.Context, projectID uuid.UUID, name string, description *string, flowKey *string) (*domain.Flow, error)
	GetFlowByID(ctx context.Context, flowID uuid.UUID) (*domain.Flow, error)
	ListFlows(ctx context.Context, projectID uuid.UUID) ([]domain.Flow, error)
	UpdateFlow(ctx context.Context, flowID uuid.UUID, name *string, description *string) (*domain.Flow, error)
	DeleteFlow(ctx context.Context, flowID uuid.UUID) error
	AddScenarioToFlow(ctx context.Context, flowID, scenarioID uuid.UUID, orderNum int) error
	RemoveScenarioFromFlow(ctx context.Context, flowID, scenarioID uuid.UUID) error
	ReorderFlowScenarios(ctx context.Context, flowID uuid.UUID, scenarioOrders []domain.ReorderFlowItem) error
	GetFlowWithScenarios(ctx context.Context, flowID uuid.UUID) (*domain.FlowWithScenarios, error)
}

type FlowHandler struct {
	service IFlowService
}

func NewFlowHandler(s IFlowService) *FlowHandler {
	return &FlowHandler{service: s}
}

func (h *FlowHandler) CreateFlow(ctx context.Context, request apiv1.CreateFlowRequestObject) (apiv1.CreateFlowResponseObject, error) {
	body := request.Body
	if body == nil {
		return apiv1.CreateFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDBODY, Message: "missing request body"},
		}, nil
	}

	projectID, err := uuid.Parse(body.ProjectId.String())
	if err != nil {
		return apiv1.CreateFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid projectId"},
		}, nil
	}

	flow, err := h.service.CreateFlow(ctx, projectID, body.Name, body.Description, body.FlowKey)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrFlowKeyExists):
			return apiv1.CreateFlow409JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWKEYALREADYEXISTS, Message: err.Error()},
			}, nil
		default:
			return apiv1.CreateFlow500JSONResponse{
				Error: struct {
					Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
					Message string                               `json:"message"`
				}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
			}, nil
		}
	}

	return apiv1.CreateFlow201JSONResponse(toDTOFlow(flow)), nil
}

// ListFlows (GET /admin/flows)
func (h *FlowHandler) ListFlows(ctx context.Context, request apiv1.ListFlowsRequestObject) (apiv1.ListFlowsResponseObject, error) {
	projectID, err := uuid.Parse(request.Params.ProjectId.String())
	if err != nil {
		return apiv1.ListFlows400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid projectId"},
		}, nil
	}

	flows, err := h.service.ListFlows(ctx, projectID)
	if err != nil {
		return apiv1.ListFlows500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}, nil
	}

	dtoFlows := make([]apiv1.Flow, len(flows))
	for i, f := range flows {
		dtoFlows[i] = toDTOFlow(&f)
	}
	return apiv1.ListFlows200JSONResponse(dtoFlows), nil
}

// GetFlow (GET /admin/flows/{flowId})
func (h *FlowHandler) GetFlow(ctx context.Context, request apiv1.GetFlowRequestObject) (apiv1.GetFlowResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.GetFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	flowWithScenarios, err := h.service.GetFlowWithScenarios(ctx, flowID)
	if err != nil {
		if errors.Is(err, domain.ErrFlowNotFound) {
			return apiv1.GetFlow404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		}
		return apiv1.GetFlow500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}, nil
	}

	scenarioDTOs := make([]apiv1.FlowScenarioItem, len(flowWithScenarios.Scenarios))
	for i, sc := range flowWithScenarios.Scenarios {
		scenarioDTOs[i] = apiv1.FlowScenarioItem{
			ScenarioId: sc.ScenarioID,
			OrderNum:   sc.OrderNum,
			Name:       sc.Name,
			Url:        sc.URL,
			Status:     apiv1.ScenarioStatus(sc.Status),
		}
	}
	return apiv1.GetFlow200JSONResponse{
		Id:          flowWithScenarios.ID,
		ProjectId:   flowWithScenarios.ProjectID,
		Name:        flowWithScenarios.Name,
		Description: flowWithScenarios.Description,
		FlowKey:     flowWithScenarios.FlowKey,
		CreatedAt:   &flowWithScenarios.CreatedAt,
		Scenarios:   scenarioDTOs,
	}, nil
}

// UpdateFlow (PATCH /admin/flows/{flowId})
func (h *FlowHandler) UpdateFlow(ctx context.Context, request apiv1.UpdateFlowRequestObject) (apiv1.UpdateFlowResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.UpdateFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	body := request.Body
	if body == nil {
		return apiv1.UpdateFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDBODY, Message: "missing request body"},
		}, nil
	}

	flow, err := h.service.UpdateFlow(ctx, flowID, body.Name, body.Description)
	if err != nil {
		if errors.Is(err, domain.ErrFlowNotFound) {
			return apiv1.UpdateFlow404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		}
		return apiv1.UpdateFlow500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}, nil
	}

	return apiv1.UpdateFlow200JSONResponse(toDTOFlow(flow)), nil
}

// DeleteFlow (DELETE /admin/flows/{flowId})
func (h *FlowHandler) DeleteFlow(ctx context.Context, request apiv1.DeleteFlowRequestObject) (apiv1.DeleteFlowResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.DeleteFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	err = h.service.DeleteFlow(ctx, flowID)
	if err != nil {
		if errors.Is(err, domain.ErrFlowNotFound) {
			return apiv1.DeleteFlow404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		}
		return apiv1.DeleteFlow500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}, nil
	}

	return apiv1.DeleteFlow204Response{}, nil
}

// AddScenarioToFlow (POST /admin/flows/{flowId}/scenarios)
func (h *FlowHandler) AddScenarioToFlow(ctx context.Context, request apiv1.AddScenarioToFlowRequestObject) (apiv1.AddScenarioToFlowResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.AddScenarioToFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	body := request.Body
	if body == nil {
		return apiv1.AddScenarioToFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDBODY, Message: "missing request body"},
		}, nil
	}

	scenarioID, err := uuid.Parse(body.ScenarioId.String())
	if err != nil {
		return apiv1.AddScenarioToFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid scenarioId"},
		}, nil
	}

	err = h.service.AddScenarioToFlow(ctx, flowID, scenarioID, body.OrderNum)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrFlowNotFound), errors.Is(err, domain.ErrScenarioNotFound):
			return apiv1.AddScenarioToFlow404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioAlreadyInFlow), errors.Is(err, domain.ErrScenarioProjectMismatch):
			code := apiv1.SCENARIOALREADYINFLOW
			if errors.Is(err, domain.ErrScenarioProjectMismatch) {
				code = apiv1.SCENARIOPROJECTMISMATCH
			}
			return apiv1.AddScenarioToFlow422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: code, Message: err.Error()},
			}, nil
		default:
			return apiv1.AddScenarioToFlow500JSONResponse{
				Error: struct {
					Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
					Message string                               `json:"message"`
				}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
			}, nil
		}
	}

	return apiv1.AddScenarioToFlow201Response{}, nil
}

// RemoveScenarioFromFlow (DELETE /admin/flows/{flowId}/scenarios/{scenarioId})
func (h *FlowHandler) RemoveScenarioFromFlow(ctx context.Context, request apiv1.RemoveScenarioFromFlowRequestObject) (apiv1.RemoveScenarioFromFlowResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.RemoveScenarioFromFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	scenarioID, err := uuid.Parse(request.ScenarioId.String())
	if err != nil {
		return apiv1.RemoveScenarioFromFlow400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid scenarioId"},
		}, nil
	}

	err = h.service.RemoveScenarioFromFlow(ctx, flowID, scenarioID)
	if err != nil {
		if errors.Is(err, domain.ErrFlowNotFound) || errors.Is(err, domain.ErrScenarioNotInFlow) {
			return apiv1.RemoveScenarioFromFlow404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		}
		return apiv1.RemoveScenarioFromFlow500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}, nil
	}

	return apiv1.RemoveScenarioFromFlow204Response{}, nil
}

// ReorderFlowScenarios (PUT /admin/flows/{flowId}/scenarios/order)
func (h *FlowHandler) ReorderFlowScenarios(ctx context.Context, request apiv1.ReorderFlowScenariosRequestObject) (apiv1.ReorderFlowScenariosResponseObject, error) {
	flowID, err := uuid.Parse(request.FlowId.String())
	if err != nil {
		return apiv1.ReorderFlowScenarios400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDPARAMETER, Message: "invalid flowId"},
		}, nil
	}

	body := request.Body
	if body == nil {
		return apiv1.ReorderFlowScenarios400JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.INVALIDBODY, Message: "missing request body"},
		}, nil
	}

	scenarioOrders := make([]domain.ReorderFlowItem, len(body.Scenarios))
	for i, item := range body.Scenarios {
		scenarioID, err := uuid.Parse(item.ScenarioId.String())
		if err != nil {
			return apiv1.ReorderFlowScenarios400JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.INVALIDPARAMETER, Message: "invalid scenarioId in list"},
			}, nil
		}
		scenarioOrders[i] = domain.ReorderFlowItem{
			ScenarioID: scenarioID,
			OrderNum:   item.OrderNum,
		}
	}

	err = h.service.ReorderFlowScenarios(ctx, flowID, scenarioOrders)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrFlowNotFound):
			return apiv1.ReorderFlowScenarios404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWNOTFOUND, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrScenarioNotInFlow):
			return apiv1.ReorderFlowScenarios404JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.SCENARIONOTINFLOW, Message: err.Error()},
			}, nil
		case errors.Is(err, domain.ErrDuplicateOrder):
			return apiv1.ReorderFlowScenarios422JSONResponse{
				Error: struct {
					Code    apiv1.ErrorResponseErrorCode `json:"code"`
					Message string                       `json:"message"`
				}{Code: apiv1.FLOWORDERCONFLICT, Message: err.Error()},
			}, nil
		default:
			return apiv1.ReorderFlowScenarios500JSONResponse{
				Error: struct {
					Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
					Message string                               `json:"message"`
				}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
			}, nil
		}
	}

	return apiv1.ReorderFlowScenarios204Response{}, nil
}
