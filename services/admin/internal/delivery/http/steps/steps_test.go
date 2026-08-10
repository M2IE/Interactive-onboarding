package steps

import (
	"context"
	"errors"
	"testing"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type mockStepsService struct {
	createFunc  func(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, nextURL *string) (*domain.Step, error)
	updateFunc  func(ctx context.Context, stepID uuid.UUID, selector, title, body, nextURL *string) (*domain.Step, error)
	deleteFunc  func(ctx context.Context, stepID uuid.UUID) error
	reorderFunc func(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error
}

func (m *mockStepsService) CreateStep(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, nextURL *string) (*domain.Step, error) {
	return m.createFunc(ctx, scenarioID, selector, title, body, nextURL)
}
func (m *mockStepsService) UpdateStep(ctx context.Context, stepID uuid.UUID, selector, title, body, nextURL *string) (*domain.Step, error) {
	return m.updateFunc(ctx, stepID, selector, title, body, nextURL)
}
func (m *mockStepsService) DeleteStep(ctx context.Context, stepID uuid.UUID) error {
	return m.deleteFunc(ctx, stepID)
}
func (m *mockStepsService) ReorderSteps(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error {
	return m.reorderFunc(ctx, scenarioID, items)
}

var stepScenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var stepID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")

func testStep() *domain.Step {
	return &domain.Step{
		ID:         stepID,
		ScenarioID: stepScenarioID,
		OrderNum:   1,
		Selector:   "#test",
		Title:      "Test Step",
		Body:       "Test Body",
	}
}

// ── CreateStep ───────────────────────────────────────────────────────────────

func TestCreateStepHandler_Success(t *testing.T) {
	svc := &mockStepsService{
		createFunc: func(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, _ *string) (*domain.Step, error) {
			return testStep(), nil
		},
	}
	h := NewStepsHandler(svc)
	body := apiv1.CreateStepJSONRequestBody{Selector: "#test", Title: "Test", Body: "Body"}

	resp, err := h.CreateStep(context.Background(), apiv1.CreateStepRequestObject{
		Id:   stepScenarioID,
		Body: &body,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateStep201JSONResponse); !ok {
		t.Errorf("expected 201, got %T", resp)
	}
}

func TestCreateStepHandler_ScenarioNotFound(t *testing.T) {
	svc := &mockStepsService{
		createFunc: func(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, _ *string) (*domain.Step, error) {
			return nil, domain.ErrScenarioNotFound
		},
	}
	h := NewStepsHandler(svc)
	body := apiv1.CreateStepJSONRequestBody{Selector: "#test", Title: "Test", Body: "Body"}

	resp, err := h.CreateStep(context.Background(), apiv1.CreateStepRequestObject{
		Id:   stepScenarioID,
		Body: &body,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateStep404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestCreateStepHandler_ScenarioPublished(t *testing.T) {
	svc := &mockStepsService{
		createFunc: func(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, _ *string) (*domain.Step, error) {
			return nil, domain.ErrScenarioPublished
		},
	}
	h := NewStepsHandler(svc)
	body := apiv1.CreateStepJSONRequestBody{Selector: "#test", Title: "Test", Body: "Body"}

	resp, err := h.CreateStep(context.Background(), apiv1.CreateStepRequestObject{
		Id:   stepScenarioID,
		Body: &body,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateStep422JSONResponse); !ok {
		t.Errorf("expected 422, got %T", resp)
	}
}

func TestCreateStepHandler_InternalError(t *testing.T) {
	svc := &mockStepsService{
		createFunc: func(ctx context.Context, scenarioID uuid.UUID, selector, title, body string, _ *string) (*domain.Step, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewStepsHandler(svc)
	body := apiv1.CreateStepJSONRequestBody{Selector: "#test", Title: "Test", Body: "Body"}

	resp, err := h.CreateStep(context.Background(), apiv1.CreateStepRequestObject{
		Id:   stepScenarioID,
		Body: &body,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.CreateStep500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

// ── UpdateStep ───────────────────────────────────────────────────────────────

func TestUpdateStepHandler_Success(t *testing.T) {
	svc := &mockStepsService{
		updateFunc: func(ctx context.Context, stepID uuid.UUID, selector, title, body, _ *string) (*domain.Step, error) {
			return testStep(), nil
		},
	}
	h := NewStepsHandler(svc)
	s := "#updated"
	body := apiv1.UpdateStepJSONRequestBody{Selector: &s}

	resp, err := h.UpdateStep(context.Background(), apiv1.UpdateStepRequestObject{
		StepId: stepID,
		Body:   &body,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateStep200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestUpdateStepHandler_NotFound(t *testing.T) {
	svc := &mockStepsService{
		updateFunc: func(ctx context.Context, stepID uuid.UUID, selector, title, body, _ *string) (*domain.Step, error) {
			return nil, domain.ErrStepNotFound
		},
	}
	h := NewStepsHandler(svc)

	resp, err := h.UpdateStep(context.Background(), apiv1.UpdateStepRequestObject{
		StepId: stepID,
		Body:   &apiv1.UpdateStepJSONRequestBody{},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateStep404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestUpdateStepHandler_Published(t *testing.T) {
	svc := &mockStepsService{
		updateFunc: func(ctx context.Context, stepID uuid.UUID, selector, title, body, _ *string) (*domain.Step, error) {
			return nil, domain.ErrScenarioPublished
		},
	}
	h := NewStepsHandler(svc)

	resp, err := h.UpdateStep(context.Background(), apiv1.UpdateStepRequestObject{
		StepId: stepID,
		Body:   &apiv1.UpdateStepJSONRequestBody{},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateStep422JSONResponse); !ok {
		t.Errorf("expected 422, got %T", resp)
	}
}

func TestUpdateStepHandler_InternalError(t *testing.T) {
	svc := &mockStepsService{
		updateFunc: func(ctx context.Context, stepID uuid.UUID, selector, title, body, _ *string) (*domain.Step, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewStepsHandler(svc)

	resp, err := h.UpdateStep(context.Background(), apiv1.UpdateStepRequestObject{
		StepId: stepID,
		Body:   &apiv1.UpdateStepJSONRequestBody{},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UpdateStep500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

// ── DeleteStep ───────────────────────────────────────────────────────────────

func TestDeleteStepHandler_Success(t *testing.T) {
	svc := &mockStepsService{
		deleteFunc: func(ctx context.Context, stepID uuid.UUID) error { return nil },
	}
	h := NewStepsHandler(svc)

	resp, err := h.DeleteStep(context.Background(), apiv1.DeleteStepRequestObject{StepId: stepID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.DeleteStep204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}

func TestDeleteStepHandler_StepNotFound(t *testing.T) {
	svc := &mockStepsService{
		deleteFunc: func(ctx context.Context, stepID uuid.UUID) error { return domain.ErrStepNotFound },
	}
	h := NewStepsHandler(svc)

	resp, err := h.DeleteStep(context.Background(), apiv1.DeleteStepRequestObject{StepId: stepID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.DeleteStep404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestDeleteStepHandler_Published(t *testing.T) {
	svc := &mockStepsService{
		deleteFunc: func(ctx context.Context, stepID uuid.UUID) error { return domain.ErrScenarioPublished },
	}
	h := NewStepsHandler(svc)

	resp, err := h.DeleteStep(context.Background(), apiv1.DeleteStepRequestObject{StepId: stepID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.DeleteStep404JSONResponse); !ok {
		t.Errorf("expected 404 (published), got %T", resp)
	}
}

func TestDeleteStepHandler_InternalError(t *testing.T) {
	svc := &mockStepsService{
		deleteFunc: func(ctx context.Context, stepID uuid.UUID) error { return errors.New("db error") },
	}
	h := NewStepsHandler(svc)

	resp, err := h.DeleteStep(context.Background(), apiv1.DeleteStepRequestObject{StepId: stepID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.DeleteStep500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

// ── ReorderSteps ─────────────────────────────────────────────────────────────

func TestReorderStepsHandler_Success(t *testing.T) {
	svc := &mockStepsService{
		reorderFunc: func(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error { return nil },
	}
	h := NewStepsHandler(svc)
	step1ID := uuid.New()
	step2ID := uuid.New()

	resp, err := h.ReorderSteps(context.Background(), apiv1.ReorderStepsRequestObject{
		Id: stepScenarioID,
		Body: &apiv1.ReorderStepsJSONRequestBody{
			Order: []apiv1.StepOrder{
				{StepId: step1ID, OrderNum: 1},
				{StepId: step2ID, OrderNum: 2},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.ReorderSteps204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}

func TestReorderStepsHandler_DuplicateOrder(t *testing.T) {
	svc := &mockStepsService{
		reorderFunc: func(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error {
			return domain.ErrDuplicateOrder
		},
	}
	h := NewStepsHandler(svc)
	stepID := uuid.New()

	resp, err := h.ReorderSteps(context.Background(), apiv1.ReorderStepsRequestObject{
		Id: stepScenarioID,
		Body: &apiv1.ReorderStepsJSONRequestBody{
			Order: []apiv1.StepOrder{
				{StepId: stepID, OrderNum: 1},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.ReorderSteps422JSONResponse); !ok {
		t.Errorf("expected 422, got %T", resp)
	}
}

func TestReorderStepsHandler_ScenarioNotFound(t *testing.T) {
	svc := &mockStepsService{
		reorderFunc: func(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error {
			return domain.ErrScenarioNotFound
		},
	}
	h := NewStepsHandler(svc)
	stepID := uuid.New()

	resp, err := h.ReorderSteps(context.Background(), apiv1.ReorderStepsRequestObject{
		Id: stepScenarioID,
		Body: &apiv1.ReorderStepsJSONRequestBody{
			Order: []apiv1.StepOrder{
				{StepId: stepID, OrderNum: 1},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.ReorderSteps404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestReorderStepsHandler_InternalError(t *testing.T) {
	svc := &mockStepsService{
		reorderFunc: func(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error {
			return errors.New("db error")
		},
	}
	h := NewStepsHandler(svc)
	stepID := uuid.New()

	resp, err := h.ReorderSteps(context.Background(), apiv1.ReorderStepsRequestObject{
		Id: stepScenarioID,
		Body: &apiv1.ReorderStepsJSONRequestBody{
			Order: []apiv1.StepOrder{
				{StepId: stepID, OrderNum: 1},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.ReorderSteps500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}
