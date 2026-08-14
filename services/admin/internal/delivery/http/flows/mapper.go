package flows

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

func toDTOFlow(flow *domain.Flow) apiv1.Flow {
	return apiv1.Flow{
		Id:          flow.ID,
		ProjectId:   flow.ProjectID,
		Name:        flow.Name,
		Description: flow.Description,
		FlowKey:     flow.FlowKey,
		CreatedAt:   &flow.CreatedAt,
	}
}
