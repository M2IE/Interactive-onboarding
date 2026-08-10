package publishes

import (
	"errors"
	"log/slog"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

// ENTITY = Domain / DTO

func ToDTOScenario(v *domain.Scenario) apiv1.Scenario {
	return apiv1.Scenario{
		Id:        v.ID,
		ProjectId: v.ProjectID,
		Url:       v.URL,
		Name:      v.Name,
		Status:    apiv1.ScenarioStatus(v.Status),
		CreatedAt: &v.CreatedAt,
		UpdatedAt: &v.UpdatedAt,
	}
}

func ToPublishErrorResponse(err error) apiv1.PublishScenarioResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.PublishScenario404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioAlreadyPublished):
		return apiv1.PublishScenario409JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOALREADYPUBLISHED, Message: err.Error()},
		}
	default:
		slog.Error("publish scenario: internal error", "error", err)
		return apiv1.PublishScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}

func ToUnpublishErrorResponse(err error) apiv1.UnpublishScenarioResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.UnpublishScenario404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioAlreadyUnpublished):
		return apiv1.UnpublishScenario409JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOALREADYUNPUBLISHED, Message: err.Error()},
		}
	default:
		slog.Error("unpublish scenario: internal error", "error", err)
		return apiv1.UnpublishScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}
