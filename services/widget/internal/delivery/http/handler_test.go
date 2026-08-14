package http

import (
	"context"
	"errors"
	"testing"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/widget"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/google/uuid"
)

var _scenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var _stepID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")
var _sessionID = uuid.MustParse("750e8400-e29b-41d4-a716-446655440002")

func testScenario() *domain.Scenario {
	return &domain.Scenario{ID: _scenarioID, Name: "Test", URL: "/test", Status: domain.ScenarioStatusPublished}
}

func testSteps() []domain.Step {
	nextURL := "/demo/next"
	return []domain.Step{
		{ID: _stepID, ScenarioID: _scenarioID, OrderNum: 1, Selector: "#s", Title: "Step 1", Body: "Body 1", NextURL: &nextURL},
	}
}

type mockWidgetService struct {
	getScenarioFn   func(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error)
	getFlowConfigFn func(ctx context.Context, projectKey, flowKey string) ([]domain.FlowScenarioDetail, *domain.Flow, error)
	processEventFn  func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error
}

func (m *mockWidgetService) GetScenario(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
	return m.getScenarioFn(ctx, projectKey, pageUrl)
}

func (m *mockWidgetService) GetFlowConfig(ctx context.Context, projectKey, flowKey string) ([]domain.FlowScenarioDetail, *domain.Flow, error) {
	return m.getFlowConfigFn(ctx, projectKey, flowKey)
}

func (m *mockWidgetService) ProcessEvent(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
	return m.processEventFn(ctx, sessionID, eventType, stepID, scenarioID, eventKey)
}

// ── GetWidgetScenario ──────────────────────────────────────────────────────

func TestGetWidgetScenario_Success(t *testing.T) {
	svc := &mockWidgetService{
		getScenarioFn: func(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
			return testScenario(), testSteps(), nil, nil, nil
		},
	}
	h := NewWidgetHandler(svc)

	resp, err := h.GetWidgetScenario(context.Background(), apiv1.GetWidgetScenarioRequestObject{
		Params: apiv1.GetWidgetScenarioParams{ProjectKey: "test-key", PageUrl: "/test"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	r, ok := resp.(apiv1.GetWidgetScenario200JSONResponse)
	if !ok {
		t.Fatalf("expected 200, got %T", resp)
	}
	if len(r.Scenario.Steps) != 1 {
		t.Errorf("steps count = %d, want 1", len(r.Scenario.Steps))
	}
	if r.Scenario.Steps[0].Title != "Step 1" {
		t.Errorf("step title = %q, want Step 1", r.Scenario.Steps[0].Title)
	}
	if r.Scenario.Steps[0].NextUrl == nil || *r.Scenario.Steps[0].NextUrl != "/demo/next" {
		t.Errorf("step nextUrl mismatch")
	}
	// Проверяем, что flow отсутствует
	if r.Flow != nil {
		t.Errorf("flow should be nil, got %v", r.Flow)
	}
}

func TestGetWidgetScenario_IncludesFlowMetadata(t *testing.T) {
	flowID := uuid.MustParse("850e8400-e29b-41d4-a716-446655440003")
	flowKey := "first-listing"
	svc := &mockWidgetService{
		getScenarioFn: func(context.Context, string, string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
			return testScenario(), testSteps(), &flowID, &flowKey, nil
		},
	}
	h := NewWidgetHandler(svc)

	response, err := h.GetWidgetScenario(context.Background(), apiv1.GetWidgetScenarioRequestObject{
		Params: apiv1.GetWidgetScenarioParams{ProjectKey: "test-key", PageUrl: "/test"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	result := response.(apiv1.GetWidgetScenario200JSONResponse)
	if result.Flow == nil || result.Flow.FlowId != flowID || result.Flow.FlowKey != flowKey {
		t.Fatalf("unexpected flow metadata: %+v", result.Flow)
	}
}

func TestGetWidgetConfig_IncludesPublishedStepCounts(t *testing.T) {
	flow := &domain.Flow{
		ID:      uuid.MustParse("850e8400-e29b-41d4-a716-446655440003"),
		FlowKey: "first-listing",
	}
	svc := &mockWidgetService{
		getFlowConfigFn: func(context.Context, string, string) ([]domain.FlowScenarioDetail, *domain.Flow, error) {
			return []domain.FlowScenarioDetail{{
				ScenarioID: _scenarioID,
				OrderNum:   1,
				URL:        "/test",
				StepCount:  3,
			}}, flow, nil
		},
	}
	h := NewWidgetHandler(svc)

	response, err := h.GetWidgetConfig(context.Background(), apiv1.GetWidgetConfigRequestObject{
		Params: apiv1.GetWidgetConfigParams{ProjectKey: "test-key", FlowKey: "first-listing"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	result := response.(apiv1.GetWidgetConfig200JSONResponse)
	if len(result.Scenarios) != 1 || result.Scenarios[0].StepCount != 3 {
		t.Fatalf("unexpected flow scenarios: %+v", result.Scenarios)
	}
}

func TestGetWidgetScenario_NoPublishedScenario(t *testing.T) {
	svc := &mockWidgetService{
		getScenarioFn: func(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
			return nil, nil, nil, nil, domain.ErrNoPublishedScenario
		},
	}
	h := NewWidgetHandler(svc)

	resp, err := h.GetWidgetScenario(context.Background(), apiv1.GetWidgetScenarioRequestObject{
		Params: apiv1.GetWidgetScenarioParams{ProjectKey: "test-key", PageUrl: "/test"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetWidgetScenario204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}

func TestGetWidgetScenario_ProjectNotFound(t *testing.T) {
	svc := &mockWidgetService{
		getScenarioFn: func(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
			return nil, nil, nil, nil, domain.ErrProjectNotFound
		},
	}
	h := NewWidgetHandler(svc)

	resp, err := h.GetWidgetScenario(context.Background(), apiv1.GetWidgetScenarioRequestObject{
		Params: apiv1.GetWidgetScenarioParams{ProjectKey: "bad-key", PageUrl: "/test"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetWidgetScenario404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}

}

func TestGetWidgetScenario_InternalError(t *testing.T) {
	svc := &mockWidgetService{
		getScenarioFn: func(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, *uuid.UUID, *string, error) {
			return nil, nil, nil, nil, errors.New("db error")
		},
	}
	h := NewWidgetHandler(svc)

	resp, err := h.GetWidgetScenario(context.Background(), apiv1.GetWidgetScenarioRequestObject{
		Params: apiv1.GetWidgetScenarioParams{ProjectKey: "test-key", PageUrl: "/test"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetWidgetScenario500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

// ── PostWidgetEvent ─────────────────────────────────────────────────────────

func mustUUID(s string) uuid.UUID { return uuid.MustParse(s) }

func TestPostWidgetEvent_Success(t *testing.T) {
	svc := &mockWidgetService{
		processEventFn: func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
			return nil
		},
	}
	h := NewWidgetHandler(svc)

	stepID := mustUUID("650e8400-e29b-41d4-a716-446655440001")
	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId: _sessionID,
			Type:      "step_viewed",
			StepId:    &stepID,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}

func TestPostWidgetEvent_NilBody(t *testing.T) {
	svc := &mockWidgetService{}
	h := NewWidgetHandler(svc)

	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: nil,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent400JSONResponse); !ok {
		t.Errorf("expected 400, got %T", resp)
	}
}

func TestPostWidgetEvent_MissingFields(t *testing.T) {
	svc := &mockWidgetService{}
	h := NewWidgetHandler(svc)

	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent400JSONResponse); !ok {
		t.Errorf("expected 400, got %T", resp)
	}
}

func TestPostWidgetEvent_InvalidEventType(t *testing.T) {
	svc := &mockWidgetService{}
	h := NewWidgetHandler(svc)

	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId: _sessionID,
			Type:      "bad_type",
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent422JSONResponse); !ok {
		t.Errorf("expected 422, got %T", resp)
	}
}

func TestPostWidgetEvent_MissingStepID(t *testing.T) {
	svc := &mockWidgetService{
		processEventFn: func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
			return domain.ErrMissingStepID
		},
	}
	h := NewWidgetHandler(svc)

	stepID := mustUUID("650e8400-e29b-41d4-a716-446655440001")
	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId: _sessionID,
			Type:      "step_viewed",
			StepId:    &stepID,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent422JSONResponse); !ok {
		t.Errorf("expected 422, got %T", resp)
	}
}

func TestPostWidgetEvent_ScenarioNotFound(t *testing.T) {
	svc := &mockWidgetService{
		processEventFn: func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
			return domain.ErrScenarioNotFound
		},
	}
	h := NewWidgetHandler(svc)

	stepID := mustUUID("650e8400-e29b-41d4-a716-446655440001")
	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId: _sessionID,
			Type:      "step_viewed",
			StepId:    &stepID,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestPostWidgetEvent_InternalError(t *testing.T) {
	svc := &mockWidgetService{
		processEventFn: func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
			return errors.New("db error")
		},
	}
	h := NewWidgetHandler(svc)

	stepID := mustUUID("650e8400-e29b-41d4-a716-446655440001")
	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId: _sessionID,
			Type:      "step_viewed",
			StepId:    &stepID,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

func TestPostWidgetEvent_ScenarioDismissed(t *testing.T) {
	svc := &mockWidgetService{
		processEventFn: func(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
			return nil
		},
	}
	h := NewWidgetHandler(svc)

	scenarioID := mustUUID("550e8400-e29b-41d4-a716-446655440000")
	resp, err := h.PostWidgetEvent(context.Background(), apiv1.PostWidgetEventRequestObject{
		Body: &apiv1.PostWidgetEventJSONRequestBody{
			SessionId:  _sessionID,
			Type:       "scenario_dismissed",
			ScenarioId: &scenarioID,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PostWidgetEvent204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}
