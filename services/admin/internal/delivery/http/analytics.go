package http

import (
	"context"
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
)

// Scenario analytics
// (GET /admin/analytics/{scenarioId})
func (h Handler) GetAnalytics(ctx context.Context, request apiv1.GetAnalyticsRequestObject) (apiv1.GetAnalyticsResponseObject, error) {
	return nil, nil
}
