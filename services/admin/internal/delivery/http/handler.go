package http

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
)

type IService interface {
}

type Handler struct {
	service IService
}

func NewHandler(s IService) apiv1.ServerInterface {
	return apiv1.NewStrictHandler(Handler{
		service: s,
	}, nil)
}

// Scenario analytics
// (GET /admin/analytics/{scenarioId})
func (h Handler) GetAnalytics(ctx context.Context, request apiv1.GetAnalyticsRequestObject) (apiv1.GetAnalyticsResponseObject, error)

// List scenarios
// (GET /admin/scenarios)
func (h Handler) ListScenarios(ctx context.Context, request apiv1.ListScenariosRequestObject) (apiv1.ListScenariosResponseObject, error)

// Create scenario
// (POST /admin/scenarios)
func (h Handler) CreateScenario(ctx context.Context, request apiv1.CreateScenarioRequestObject) (apiv1.CreateScenarioResponseObject, error)

// Get scenario
// (GET /admin/scenarios/{id})
func (h Handler) GetScenario(ctx context.Context, request apiv1.GetScenarioRequestObject) (apiv1.GetScenarioResponseObject, error)

// Update scenario
// (PATCH /admin/scenarios/{id})
func (h Handler) UpdateScenario(ctx context.Context, request apiv1.UpdateScenarioRequestObject) (apiv1.UpdateScenarioResponseObject, error)

// Publish scenario
// (POST /admin/scenarios/{id}/publish)
func (h Handler) PublishScenario(ctx context.Context, request apiv1.PublishScenarioRequestObject) (apiv1.PublishScenarioResponseObject, error)

// Create step
// (POST /admin/scenarios/{id}/steps)
func (h Handler) CreateStep(ctx context.Context, request apiv1.CreateStepRequestObject) (apiv1.CreateStepResponseObject, error)

// Reorder steps
// (PUT /admin/scenarios/{id}/steps/order)
func (h Handler) ReorderSteps(ctx context.Context, request apiv1.ReorderStepsRequestObject) (apiv1.ReorderStepsResponseObject, error)

// Delete step
// (DELETE /admin/scenarios/{id}/steps/{stepId})
func (h Handler) DeleteStep(ctx context.Context, request apiv1.DeleteStepRequestObject) (apiv1.DeleteStepResponseObject, error)

// Update step
// (PATCH /admin/scenarios/{id}/steps/{stepId})
func (h Handler) UpdateStep(ctx context.Context, request apiv1.UpdateStepRequestObject) (apiv1.UpdateStepResponseObject, error)

// Unpublish scenario
// (POST /admin/scenarios/{id}/unpublish)
func (h Handler) UnpublishScenario(ctx context.Context, request apiv1.UnpublishScenarioRequestObject) (apiv1.UnpublishScenarioResponseObject, error)
