package projects

import (
	"context"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

type IProjectService interface {
	GetByKey(ctx context.Context, projectKey string) (*domain.Project, error)
}

type ProjectHandler struct {
	service IProjectService
}

func NewProjectHandler(s IProjectService) *ProjectHandler {
	return &ProjectHandler{service: s}
}

func (h *ProjectHandler) GetProjectByKey(ctx context.Context, request apiv1.GetProjectByKeyRequestObject) (apiv1.GetProjectByKeyResponseObject, error) {
	project, err := h.service.GetByKey(ctx, request.ProjectKey)
	if err != nil {
		return ToGetProjectErrorResponse(err), nil
	}

	return apiv1.GetProjectByKey200JSONResponse(ToDTOProject(project)), nil
}
