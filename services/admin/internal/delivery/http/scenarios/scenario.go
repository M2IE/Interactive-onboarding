package scenarios

import (
	"context"
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IScenarioService interface {
	List(ctx context.Context) ([]domain.Scenario, error)
	Create(ctx context.Context, command domain.CreateScenario) (*domain.Scenario, error)
	GetByID(ctx context.Context, scenarioID uuid.UUID) (*domain.Scenario, error)
	Update(ctx context.Context, scenarioID uuid.UUID, command domain.UpdateScenario) (*domain.Scenario, error)
}

type ScenarioHandler struct {
	service IScenarioService
}

func NewScenarioHandler(s IScenarioService) *ScenarioHandler {
	return &ScenarioHandler{service: s}
}

func (h *ScenarioHandler) List(ctx context.Context, _ apiv1.ListScenariosRequestObject) (apiv1.ListScenariosResponseObject, error) {
	scenarios, err := h.service.List(ctx)
	if err != nil {
		return ToListErrorResponse(err), nil
	}

	return apiv1.ListScenarios200JSONResponse(ToDTOsScenarios(scenarios)), nil
}

func (h *ScenarioHandler) Get(ctx context.Context, request apiv1.GetScenarioRequestObject) (apiv1.GetScenarioResponseObject, error) {
	scenario, err := h.service.GetByID(ctx, request.Id)
	if err != nil {
		return ToGetErrorResponse(err), nil
	}

	return apiv1.GetScenario200JSONResponse(ToDTOScenario(scenario)), nil
}

func (h *ScenarioHandler) Create(ctx context.Context, request apiv1.CreateScenarioRequestObject) (apiv1.CreateScenarioResponseObject, error) {
	scenario, err := h.service.Create(ctx, ToDomainScenarioCreate(*request.Body))
	if err != nil {
		return ToCreateErrorResponse(err), nil
	}

	return apiv1.CreateScenario201JSONResponse(ToDTOScenario(scenario)), nil
}

func (h *ScenarioHandler) Update(ctx context.Context, request apiv1.UpdateScenarioRequestObject) (apiv1.UpdateScenarioResponseObject, error) {
	scenario, err := h.service.Update(ctx, request.Id, ToDomainScenarioUpdate(*request.Body))
	if err != nil {
		return ToUpdateErrorResponse(err), nil
	}

	return apiv1.UpdateScenario200JSONResponse(ToDTOScenario(scenario)), nil
}
