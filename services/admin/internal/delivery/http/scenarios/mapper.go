package scenarios

import (
	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

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

func ToDTOsScenarios(v []domain.Scenario) []apiv1.Scenario {
	results := make([]apiv1.Scenario, 0, len(v))
	for _, v := range v {
		results = append(results, ToDTOScenario(&v))
	}

	return results
}

func ToDomainScenarioCreate(v apiv1.CreateScenarioJSONRequestBody) domain.CreateScenario {
	return domain.CreateScenario{
		Name:      v.Name,
		ProjectID: v.ProjectId,
		Url:       v.Url,
	}
}

func ToDomainScenarioUpdate(v apiv1.UpdateScenarioJSONRequestBody) domain.UpdateScenario {
	return domain.UpdateScenario{
		Name: v.Name,
		Url:  v.Url,
	}
}

func ToDomainScenariosList(v apiv1.ListScenariosParams) domain.ListScenarios {
	page := 1
	if v.Page != nil && *v.Page >= 1 {
		page = *v.Page
	}

	size := 20
	if v.Size != nil {
		size = *v.Size
	}

	switch {
	case size < 1:
		size = 1
	case size > 100:
		size = 100
	}

	return domain.ListScenarios{
		ProjectID: v.ProjectId,
		Page:      page,
		Size:      size,
	}
}

func ToListErrorResponse(err error) apiv1.ListScenariosResponseObject {
	return nil
}

func ToGetErrorResponse(err error) apiv1.GetScenarioResponseObject {
	return nil
}

func ToCreateErrorResponse(err error) apiv1.CreateScenarioResponseObject {
	return nil
}

func ToUpdateErrorResponse(err error) apiv1.UpdateScenarioResponseObject {
	return nil
}
