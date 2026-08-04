package http

import (
	"context"
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
)

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
