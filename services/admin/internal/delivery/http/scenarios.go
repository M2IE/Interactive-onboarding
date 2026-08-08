package http

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
)

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
