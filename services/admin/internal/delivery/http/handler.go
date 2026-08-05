package http

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/delivery/http/publishes"
)

type IService interface {
	publishes.IPublishService
}

type Handler struct {
	*publishes.PublishHandler
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		PublishHandler: publishes.NewPublishHandler(s),
	}, nil)
}

// Scenario analytics
// (GET /admin/analytics/{scenarioId})
func (h Handler) GetAnalytics(ctx context.Context, request apiv1.GetAnalyticsRequestObject) (apiv1.GetAnalyticsResponseObject, error) {
	return nil, nil
}

// List scenarios
// (GET /admin/scenarios)
func (h Handler) ListScenarios(ctx context.Context, request apiv1.ListScenariosRequestObject) (apiv1.ListScenariosResponseObject, error) {
	return nil, nil
}

// Create scenario
// (POST /admin/scenarios)
func (h Handler) CreateScenario(ctx context.Context, request apiv1.CreateScenarioRequestObject) (apiv1.CreateScenarioResponseObject, error) {
	return nil, nil
}

// Get scenario
// (GET /admin/scenarios/{id})
func (h Handler) GetScenario(ctx context.Context, request apiv1.GetScenarioRequestObject) (apiv1.GetScenarioResponseObject, error) {
	return nil, nil
}

// Update scenario
// (PATCH /admin/scenarios/{id})
func (h Handler) UpdateScenario(ctx context.Context, request apiv1.UpdateScenarioRequestObject) (apiv1.UpdateScenarioResponseObject, error) {
	return nil, nil
}

// Create step
// (POST /admin/scenarios/{id}/steps)
func (h Handler) CreateStep(ctx context.Context, request apiv1.CreateStepRequestObject) (apiv1.CreateStepResponseObject, error) {
	return nil, nil
}

// Reorder steps
// (PUT /admin/scenarios/{id}/steps/order)
func (h Handler) ReorderSteps(ctx context.Context, request apiv1.ReorderStepsRequestObject) (apiv1.ReorderStepsResponseObject, error) {
	return nil, nil
}

// Delete step
// (DELETE /admin/scenarios/{id}/steps/{stepId})
func (h Handler) DeleteStep(ctx context.Context, request apiv1.DeleteStepRequestObject) (apiv1.DeleteStepResponseObject, error) {
	return nil, nil
}

// Update step
// (PATCH /admin/scenarios/{id}/steps/{stepId})
func (h Handler) UpdateStep(ctx context.Context, request apiv1.UpdateStepRequestObject) (apiv1.UpdateStepResponseObject, error) {
	return nil, nil
}
