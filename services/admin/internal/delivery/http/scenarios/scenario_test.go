package scenarios

import (
	"context"
	"errors"
	"testing"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type mockScenarioService struct {
	listFunc   func(ctx context.Context, cmd domain.ListScenarios) ([]domain.Scenario, int64, error)
	createFunc func(ctx context.Context, cmd domain.CreateScenario) (*domain.Scenario, error)
	getFunc    func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error)
	updateFunc func(ctx context.Context, id uuid.UUID, cmd domain.UpdateScenario) (*domain.Scenario, error)
}

func (m *mockScenarioService) List(ctx context.Context, cmd domain.ListScenarios) ([]domain.Scenario, int64, error) {
	return m.listFunc(ctx, cmd)
}
func (m *mockScenarioService) Create(ctx context.Context, cmd domain.CreateScenario) (*domain.Scenario, error) {
	return m.createFunc(ctx, cmd)
}
func (m *mockScenarioService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
	return m.getFunc(ctx, id)
}
func (m *mockScenarioService) Update(ctx context.Context, id uuid.UUID, cmd domain.UpdateScenario) (*domain.Scenario, error) {
	return m.updateFunc(ctx, id, cmd)
}

var scenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var projectID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")

func testScenario() *domain.Scenario {
	return &domain.Scenario{ID: scenarioID, ProjectID: projectID, Name: "Test", URL: "/test", Status: domain.ScenarioStatusDraft}
}

func TestListHandler_Success(t *testing.T) {
	svc := &mockScenarioService{
		listFunc: func(ctx context.Context, cmd domain.ListScenarios) ([]domain.Scenario, int64, error) {
			return []domain.Scenario{*testScenario()}, 1, nil
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.ListScenarios(context.Background(), apiv1.ListScenariosRequestObject{
		Params: apiv1.ListScenariosParams{Page: ptr(1), Size: ptr(20)},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	r, ok := resp.(apiv1.ListScenarios200JSONResponse)
	if !ok {
		t.Errorf("expected 200, got %T", resp)
	}
	if r.Total != 1 {
		t.Errorf("total = %d, want 1", r.Total)
	}
}

func TestListHandler_Error(t *testing.T) {
	svc := &mockScenarioService{
		listFunc: func(ctx context.Context, cmd domain.ListScenarios) ([]domain.Scenario, int64, error) {
			return nil, 0, errors.New("db error")
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.ListScenarios(context.Background(), apiv1.ListScenariosRequestObject{
		Params: apiv1.ListScenariosParams{Page: ptr(1), Size: ptr(20)},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.ListScenarios500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

func TestGetHandler_Success(t *testing.T) {
	svc := &mockScenarioService{
		getFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return testScenario(), nil
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.GetScenario(context.Background(), apiv1.GetScenarioRequestObject{Id: scenarioID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetScenario200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestGetHandler_NotFound(t *testing.T) {
	svc := &mockScenarioService{
		getFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return nil, domain.ErrScenarioNotFound
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.GetScenario(context.Background(), apiv1.GetScenarioRequestObject{Id: scenarioID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetScenario404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestCreateHandler_Success(t *testing.T) {
	svc := &mockScenarioService{
		createFunc: func(ctx context.Context, cmd domain.CreateScenario) (*domain.Scenario, error) {
			return testScenario(), nil
		},
	}
	h := NewScenarioHandler(svc)

	name := "New"
	url := "/new"
	resp, err := h.CreateScenario(context.Background(), apiv1.CreateScenarioRequestObject{
		Body: &apiv1.CreateScenarioJSONRequestBody{ProjectId: projectID, Name: name, Url: url},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateScenario201JSONResponse); !ok {
		t.Errorf("expected 201, got %T", resp)
	}
}

func TestCreateHandler_DraftExists(t *testing.T) {
	svc := &mockScenarioService{
		createFunc: func(ctx context.Context, cmd domain.CreateScenario) (*domain.Scenario, error) {
			return nil, domain.ErrScenarioDraftAlreadyExists
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.CreateScenario(context.Background(), apiv1.CreateScenarioRequestObject{
		Body: &apiv1.CreateScenarioJSONRequestBody{ProjectId: projectID, Name: "Dup", Url: "/dup"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateScenario409JSONResponse); !ok {
		t.Errorf("expected 409, got %T", resp)
	}
}

func TestUpdateHandler_Success(t *testing.T) {
	svc := &mockScenarioService{
		updateFunc: func(ctx context.Context, id uuid.UUID, cmd domain.UpdateScenario) (*domain.Scenario, error) {
			return testScenario(), nil
		},
	}
	h := NewScenarioHandler(svc)

	name := "Updated"
	resp, err := h.UpdateScenario(context.Background(), apiv1.UpdateScenarioRequestObject{
		Id:   scenarioID,
		Body: &apiv1.UpdateScenarioJSONRequestBody{Name: &name},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateScenario200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestUpdateHandler_NotFound(t *testing.T) {
	svc := &mockScenarioService{
		updateFunc: func(ctx context.Context, id uuid.UUID, cmd domain.UpdateScenario) (*domain.Scenario, error) {
			return nil, domain.ErrScenarioNotFound
		},
	}
	h := NewScenarioHandler(svc)

	resp, err := h.UpdateScenario(context.Background(), apiv1.UpdateScenarioRequestObject{
		Id:   scenarioID,
		Body: &apiv1.UpdateScenarioJSONRequestBody{},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateScenario404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func ptr[T any](v T) *T { return &v }
