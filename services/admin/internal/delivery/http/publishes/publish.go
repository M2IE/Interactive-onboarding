package publishes

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IPublishService interface {
	Publish(ctx context.Context, scenarioID uuid.UUID) (*domain.Scenario, error)
	Unpublish(ctx context.Context, scenarioID uuid.UUID) error
}

type PublishHandler struct {
	service IPublishService
}

func NewPublishHandler(s IPublishService) *PublishHandler {
	return &PublishHandler{service: s}
}

func (h PublishHandler) PublishScenario(ctx context.Context, request apiv1.PublishScenarioRequestObject) (apiv1.PublishScenarioResponseObject, error) {
	scenario, err := h.service.Publish(ctx, request.Id)
	if err != nil {
		return ToPublishErrorResponse(err), nil
	}

	return apiv1.PublishScenario200JSONResponse(ToDTOScenario(scenario)), nil
}

func (h PublishHandler) UnpublishScenario(ctx context.Context, request apiv1.UnpublishScenarioRequestObject) (apiv1.UnpublishScenarioResponseObject, error) {
	err := h.service.Unpublish(ctx, request.Id)
	if err != nil {
		return ToUnpublishErrorResponse(err), nil
	}

	return apiv1.UnpublishScenario204Response{}, nil
}
