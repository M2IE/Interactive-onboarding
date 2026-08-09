package scenarios

import (
	"errors"
	"log/slog"

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

func ToDTOScenarioWithSteps(v *domain.Scenario, steps []domain.Step) apiv1.ScenarioWithSteps {
	return apiv1.ScenarioWithSteps{
		Id:        v.ID,
		ProjectId: v.ProjectID,
		Url:       v.URL,
		Name:      v.Name,
		Status:    apiv1.ScenarioStatus(v.Status),
		CreatedAt: &v.CreatedAt,
		UpdatedAt: &v.UpdatedAt,
		Steps:     toDTOSteps(steps),
	}
}

func toDTOStep(s domain.Step) apiv1.Step {
	return apiv1.Step{
		Id:       s.ID,
		OrderNum: s.OrderNum,
		Selector: s.Selector,
		Title:    s.Title,
		Body:     s.Body,
		NextUrl:  s.NextURL,
	}
}

func toDTOSteps(steps []domain.Step) []apiv1.Step {
	results := make([]apiv1.Step, 0, len(steps))
	for _, s := range steps {
		results = append(results, toDTOStep(s))
	}

	return results
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
	slog.Error("list scenarios: internal error", "error", err)
	return apiv1.ListScenarios500JSONResponse{
		Error: struct {
			Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
			Message string                               `json:"message"`
		}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
	}
}

func ToGetErrorResponse(err error) apiv1.GetScenarioResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.GetScenario404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	default:
		slog.Error("get scenario: internal error", "error", err)
		return apiv1.GetScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}

func ToCreateErrorResponse(err error) apiv1.CreateScenarioResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioDraftAlreadyExists):
		return apiv1.CreateScenario409JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("create scenario: internal error", "error", err)
		return apiv1.CreateScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}

func ToUpdateErrorResponse(err error) apiv1.UpdateScenarioResponseObject {
	switch {
	case errors.Is(err, domain.ErrScenarioNotFound):
		return apiv1.UpdateScenario404JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIONOTFOUND, Message: err.Error()},
		}
	case errors.Is(err, domain.ErrScenarioNotEditable):
		return apiv1.UpdateScenario409JSONResponse{
			Error: struct {
				Code    apiv1.ErrorResponseErrorCode `json:"code"`
				Message string                       `json:"message"`
			}{Code: apiv1.SCENARIOSTATECONFLICT, Message: err.Error()},
		}
	default:
		slog.Error("update scenario: internal error", "error", err)
		return apiv1.UpdateScenario500JSONResponse{
			Error: struct {
				Code    apiv1.InternalErrorResponseErrorCode `json:"code"`
				Message string                               `json:"message"`
			}{Code: apiv1.INTERNALERROR, Message: "internal server error"},
		}
	}
}
