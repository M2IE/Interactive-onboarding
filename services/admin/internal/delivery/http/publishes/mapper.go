package publishes

import (
	"errors"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

// ENTITY = Domain / DTO

func ToDTOScenarioVersion(v *domain.Scenario) apiv1.ScenarioVersion {
	return apiv1.ScenarioVersion{
		Id:       v.VersionID,
		IsActive: v.IsActive,
		Version:  v.Version,
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
		return apiv1.PublishScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: err.Error()},
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
		return apiv1.UnpublishScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: err.Error()},
		}
	}
}
