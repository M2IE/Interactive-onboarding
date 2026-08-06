package analytics

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IAnalyticsService interface {
	GetAnalytics(ctx context.Context, scenarioID uuid.UUID) (*domain.Analytics, error)
}

type AnalyticsHandler struct {
	s IAnalyticsService
}

func NewAnalitics(s IAnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		s: s,
	}
}

func (h AnalyticsHandler) GetAnalytics(ctx context.Context, request apiv1.GetAnalyticsRequestObject) (apiv1.GetAnalyticsResponseObject, error) {
	analytics, err := h.s.GetAnalytics(ctx, request.ScenarioId)
	if err != nil {
		return ToAnalyticsErrorResponse(err), nil
	}

	return apiv1.GetAnalytics200JSONResponse(ToDTOAnalytics(analytics)), nil
}
