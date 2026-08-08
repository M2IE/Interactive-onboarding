package projects

import (
	"errors"
	"log/slog"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

func ToDTOProject(v *domain.Project) apiv1.Project {
	return apiv1.Project{
		Id:         v.ID,
		Name:       v.Name,
		ProjectKey: v.ProjectKey,
		CreatedAt:  &v.CreatedAt,
	}
}

func ToGetProjectErrorResponse(err error) apiv1.GetProjectByKeyResponseObject {
	switch {
	case errors.Is(err, domain.ErrProjectNotFound):
		return apiv1.GetProjectByKey404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.PROJECTNOTFOUND, Message: err.Error()},
		}
	default:
		slog.Error("get project by key: internal error", "error", err)
		return apiv1.GetProjectByKey500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}
