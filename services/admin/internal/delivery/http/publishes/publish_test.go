package publishes

import (
	"context"
	"errors"
	"testing"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type mockPublishService struct {
	publishFunc   func(ctx context.Context, scenarioID uuid.UUID) (*domain.Scenario, error)
	unpublishFunc func(ctx context.Context, scenarioID uuid.UUID) error
}

func (m *mockPublishService) Publish(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
	return m.publishFunc(ctx, id)
}
func (m *mockPublishService) Unpublish(ctx context.Context, id uuid.UUID) error {
	return m.unpublishFunc(ctx, id)
}

var testID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

func testScenario() *domain.Scenario {
	return &domain.Scenario{ID: testID, ProjectID: uuid.New(), Name: "Test", URL: "/test", Status: domain.ScenarioStatusPublished}
}

func TestPublishHandler_Success(t *testing.T) {
	svc := &mockPublishService{
		publishFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return testScenario(), nil
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.PublishScenario(context.Background(), apiv1.PublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PublishScenario200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestPublishHandler_NotFound(t *testing.T) {
	svc := &mockPublishService{
		publishFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return nil, domain.ErrScenarioNotFound
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.PublishScenario(context.Background(), apiv1.PublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PublishScenario404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestPublishHandler_AlreadyPublished(t *testing.T) {
	svc := &mockPublishService{
		publishFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return nil, domain.ErrScenarioAlreadyPublished
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.PublishScenario(context.Background(), apiv1.PublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PublishScenario409JSONResponse); !ok {
		t.Errorf("expected 409, got %T", resp)
	}
}

func TestPublishHandler_InternalError(t *testing.T) {
	svc := &mockPublishService{
		publishFunc: func(ctx context.Context, id uuid.UUID) (*domain.Scenario, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.PublishScenario(context.Background(), apiv1.PublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.PublishScenario500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

func TestUnpublishHandler_Success(t *testing.T) {
	svc := &mockPublishService{
		unpublishFunc: func(ctx context.Context, id uuid.UUID) error { return nil },
	}
	h := NewPublishHandler(svc)

	resp, err := h.UnpublishScenario(context.Background(), apiv1.UnpublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UnpublishScenario204Response); !ok {
		t.Errorf("expected 204, got %T", resp)
	}
}

func TestUnpublishHandler_NotFound(t *testing.T) {
	svc := &mockPublishService{
		unpublishFunc: func(ctx context.Context, id uuid.UUID) error {
			return domain.ErrScenarioNotFound
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.UnpublishScenario(context.Background(), apiv1.UnpublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UnpublishScenario404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestUnpublishHandler_AlreadyUnpublished(t *testing.T) {
	svc := &mockPublishService{
		unpublishFunc: func(ctx context.Context, id uuid.UUID) error {
			return domain.ErrScenarioAlreadyUnpublished
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.UnpublishScenario(context.Background(), apiv1.UnpublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UnpublishScenario409JSONResponse); !ok {
		t.Errorf("expected 409, got %T", resp)
	}
}

func TestUnpublishHandler_InternalError(t *testing.T) {
	svc := &mockPublishService{
		unpublishFunc: func(ctx context.Context, id uuid.UUID) error {
			return errors.New("db error")
		},
	}
	h := NewPublishHandler(svc)

	resp, err := h.UnpublishScenario(context.Background(), apiv1.UnpublishScenarioRequestObject{Id: testID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.UnpublishScenario500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}
