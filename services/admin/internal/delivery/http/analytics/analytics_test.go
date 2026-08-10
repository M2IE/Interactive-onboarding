package analytics

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"

	apiv1 "github.com/M2IE/Interactive-onboarding/gen/rest/v1/go/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type mockAnalyticsService struct {
	analyticsFunc   func(ctx context.Context, id uuid.UUID) (*domain.Analytics, error)
	reportFunc      func(ctx context.Context, id uuid.UUID) (string, error)
	downloadFunc    func(ctx context.Context, key string) (io.ReadCloser, error)
}

func (m *mockAnalyticsService) GetAnalytics(ctx context.Context, id uuid.UUID) (*domain.Analytics, error) {
	return m.analyticsFunc(ctx, id)
}
func (m *mockAnalyticsService) GenerateReport(ctx context.Context, id uuid.UUID) (string, error) {
	return m.reportFunc(ctx, id)
}
func (m *mockAnalyticsService) DownloadReport(ctx context.Context, key string) (io.ReadCloser, error) {
	return m.downloadFunc(ctx, key)
}

var analyticsTestID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

func TestAnalyticsHandler_Success(t *testing.T) {
	svc := &mockAnalyticsService{
		analyticsFunc: func(ctx context.Context, id uuid.UUID) (*domain.Analytics, error) {
			return &domain.Analytics{TotalViews: 10}, nil
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalytics(context.Background(), apiv1.GetAnalyticsRequestObject{ScenarioId: analyticsTestID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalytics200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestAnalyticsHandler_NotFound(t *testing.T) {
	svc := &mockAnalyticsService{
		analyticsFunc: func(ctx context.Context, id uuid.UUID) (*domain.Analytics, error) {
			return nil, domain.ErrScenarioNotFound
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalytics(context.Background(), apiv1.GetAnalyticsRequestObject{ScenarioId: analyticsTestID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalytics404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestAnalyticsHandler_InternalError(t *testing.T) {
	svc := &mockAnalyticsService{
		analyticsFunc: func(ctx context.Context, id uuid.UUID) (*domain.Analytics, error) {
			return nil, errors.New("db error")
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalytics(context.Background(), apiv1.GetAnalyticsRequestObject{ScenarioId: analyticsTestID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalytics500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}

func TestGenerateReportHandler_Success(t *testing.T) {
	svc := &mockAnalyticsService{
		reportFunc: func(ctx context.Context, id uuid.UUID) (string, error) {
			return "reports/test.pdf", nil
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GenerateAnalyticsReport(context.Background(), apiv1.GenerateAnalyticsReportRequestObject{ScenarioId: analyticsTestID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GenerateAnalyticsReport200JSONResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestGenerateReportHandler_NotFound(t *testing.T) {
	svc := &mockAnalyticsService{
		reportFunc: func(ctx context.Context, id uuid.UUID) (string, error) {
			return "", domain.ErrScenarioNotFound
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GenerateAnalyticsReport(context.Background(), apiv1.GenerateAnalyticsReportRequestObject{ScenarioId: analyticsTestID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GenerateAnalyticsReport404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestDownloadHandler_Success(t *testing.T) {
	svc := &mockAnalyticsService{
		downloadFunc: func(ctx context.Context, key string) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader("pdf")), nil
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalyticsReport(context.Background(), apiv1.GetAnalyticsReportRequestObject{
		ScenarioId: analyticsTestID,
		Params:     apiv1.GetAnalyticsReportParams{Filename: "test.pdf"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalyticsReport200ApplicationpdfResponse); !ok {
		t.Errorf("expected 200, got %T", resp)
	}
}

func TestDownloadHandler_NotFound(t *testing.T) {
	svc := &mockAnalyticsService{
		downloadFunc: func(ctx context.Context, key string) (io.ReadCloser, error) {
			return nil, domain.ErrReportNotFound
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalyticsReport(context.Background(), apiv1.GetAnalyticsReportRequestObject{
		ScenarioId: analyticsTestID,
		Params:     apiv1.GetAnalyticsReportParams{Filename: "missing.pdf"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalyticsReport404JSONResponse); !ok {
		t.Errorf("expected 404, got %T", resp)
	}
}

func TestDownloadHandler_InternalError(t *testing.T) {
	svc := &mockAnalyticsService{
		downloadFunc: func(ctx context.Context, key string) (io.ReadCloser, error) {
			return nil, errors.New("s3 error")
		},
	}
	h := NewAnalitics(svc)

	resp, err := h.GetAnalyticsReport(context.Background(), apiv1.GetAnalyticsReportRequestObject{
		ScenarioId: analyticsTestID,
		Params:     apiv1.GetAnalyticsReportParams{Filename: "test.pdf"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := resp.(apiv1.GetAnalyticsReport500JSONResponse); !ok {
		t.Errorf("expected 500, got %T", resp)
	}
}
