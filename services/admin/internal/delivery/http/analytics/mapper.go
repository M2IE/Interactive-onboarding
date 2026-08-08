package analytics

import (
	"errors"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

// ENTITY = Domain / DTO

func ToDTOAnalytics(v *domain.Analytics) apiv1.AnalyticsResponse {
	r := apiv1.AnalyticsResponse{
		TotalViews: v.TotalViews,
		Completed:  v.Completed,
		Dismissed:  v.Dismissed,
	}
	for _, s := range v.Steps {
		r.Steps = append(r.Steps, apiv1.StepAnalytics{
			StepId:    s.StepID,
			Title:     s.Title,
			OrderNum:  s.OrderNum,
			Views:     s.Views,
			Completed: s.Completed,
		})
	}
	return r
}

func ToAnalyticsErrorResponse(err error) apiv1.GetAnalyticsResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.GetAnalytics404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	default:
		return apiv1.GetAnalytics500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: err.Error()},
		}
	}
}

func ToAnalyticsReportErrorResponse(err error) apiv1.GenerateAnalyticsReportResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.GenerateAnalyticsReport404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	default:
		return apiv1.GenerateAnalyticsReport500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: err.Error()},
		}
	}
}

func ToDownloadReportErrorResponse(err error) apiv1.GetAnalyticsReportResponseObject {
	switch {
	case errors.Is(err, domain.ErrReportNotFound):
		return apiv1.GetAnalyticsReport404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	default:
		return apiv1.GetAnalyticsReport500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: err.Error()},
		}
	}
}
