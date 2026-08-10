package analytics

import (
	"context"
	"io"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IAnalyticsService interface {
	GetAnalytics(ctx context.Context, scenarioID uuid.UUID) (*domain.Analytics, error)
	GenerateReport(ctx context.Context, scenarioID uuid.UUID) (string, error)
	DownloadReport(ctx context.Context, key string) (io.ReadCloser, error)
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

func (h AnalyticsHandler) GenerateAnalyticsReport(ctx context.Context, request apiv1.GenerateAnalyticsReportRequestObject) (apiv1.GenerateAnalyticsReportResponseObject, error) {
	filename, err := h.s.GenerateReport(ctx, request.ScenarioId)
	if err != nil {
		return ToAnalyticsReportErrorResponse(err), nil
	}

	return apiv1.GenerateAnalyticsReport200JSONResponse{Filename: filename}, nil
}

func (h AnalyticsHandler) GetAnalyticsReport(ctx context.Context, request apiv1.GetAnalyticsReportRequestObject) (apiv1.GetAnalyticsReportResponseObject, error) {
	body, err := h.s.DownloadReport(ctx, request.Params.Filename)
	if err != nil {
		return ToDownloadReportErrorResponse(err), nil
	}

	return apiv1.GetAnalyticsReport200ApplicationpdfResponse{Body: body}, nil
}
