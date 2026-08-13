//go:build integration

package analytics

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	chq "github.com/M2IE/Interactive-onboarding/services/admin/queries/clickhouse"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/M2IE/Interactive-onboarding/tests/dbScenario"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
)

var (
	testDB rdb.Database
	testCH olap.Database
)

type mockS3 struct {
	storage     map[string][]byte
	downloadErr error
}

func (m *mockS3) Upload(ctx context.Context, bucket, key string, body io.Reader, contentType string) error {
	data, _ := io.ReadAll(body)
	m.storage[key] = data
	return nil
}

func (m *mockS3) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	if m.downloadErr != nil {
		return nil, m.downloadErr
	}

	data, ok := m.storage[key]
	if !ok {
		return nil, &types.NoSuchKey{Message: aws.String("not found")}
	}

	return io.NopCloser(bytes.NewReader(data)), nil
}

type mockPDF struct{}

func (m *mockPDF) GeneratePDF(ctx context.Context, content pdfengine.Content) ([]byte, error) {
	return []byte("PDF"), nil
}

func TestMain(m *testing.M) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	db, cleanup, err := dbScenario.StartPostgres(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "setup postgres: %v\n", err)
		os.Exit(1)
	}

	testDB = db
	ch, chCleanup, err := dbScenario.StartClickHouse(ctx)
	if err != nil {
		cleanup()
		fmt.Fprintf(os.Stderr, "setup clickhouse: %v\n", err)
		os.Exit(1)
	}

	testCH = ch

	code := m.Run()
	chCleanup()
	cleanup()
	os.Exit(code)
}

func insertCHEvents(t *testing.T, ctx context.Context, projID, scID uuid.UUID, stepID *uuid.UUID, eventType string, n int) {
	t.Helper()
	batch, err := testCH.PrepareBatch(ctx, chq.InsertEvent)

	if err != nil {
		t.Fatalf("prepare ch batch: %v", err)
	}
	for i := 0; i < n; i++ {
		if err := batch.Append(uuid.New(), projID, scID, stepID, fmt.Sprintf("sess-%s-%d", eventType, i), eventType, uuid.NewString()); err != nil {
			t.Fatalf("append ch event: %v", err)
		}
	}

	if err := batch.Send(); err != nil {
		t.Fatalf("send ch batch: %v", err)
	}
}

func TestAnalytics_ScenarioExists(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")
	projID := createProject(t, ctx)

	scID := createScenario(t, ctx, projID)

	exists, err := infra.ScenarioExists(ctx, nil, scID)
	if err != nil {
		t.Fatalf("scenario exists: %v", err)
	}
	if !exists {
		t.Error("expected scenario to exist")
	}

	exists, err = infra.ScenarioExists(ctx, nil, uuid.New())
	if err != nil {
		t.Fatalf("scenario exists: %v", err)
	}
	if exists {
		t.Error("expected scenario to not exist")
	}
}

func TestAnalytics_GetAnalytics(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	step1ID := uuid.New()
	step2ID := uuid.New()
	_, err := q.CreateStep(ctx, testDB, gen.CreateStepParams{
		ID:         step1ID,
		ScenarioID: scID,
		OrderNum:   1,
		Selector:   "#1",
		Title:      "S1",
		Body:       "B1",
	})

	if err != nil {
		t.Fatalf("create step1: %v", err)
	}
	_, err = q.CreateStep(ctx, testDB, gen.CreateStepParams{
		ID:         step2ID,
		ScenarioID: scID,
		OrderNum:   2,
		Selector:   "#2",
		Title:      "S2",
		Body:       "B2",
	})

	if err != nil {
		t.Fatalf("create step2: %v", err)
	}

	insertCHEvents(t, ctx, projID, scID, &step1ID, "step_viewed", 10)
	insertCHEvents(t, ctx, projID, scID, nil, "scenario_completed", 3)

	result, err := infra.GetScenarioAnalytics(ctx, nil, scID)
	if err != nil {
		t.Fatalf("get analytics: %v", err)
	}
	if result.TotalViews != 10 {
		t.Errorf("totalViews = %d, want 10", result.TotalViews)
	}

	if result.Completed != 3 {
		t.Errorf("completed = %d, want 3", result.Completed)
	}

	steps, err := infra.GetStepAnalytics(ctx, nil, scID)
	if err != nil {
		t.Fatalf("get step analytics: %v", err)
	}
	if len(steps) != 2 {
		t.Fatalf("steps count = %d, want 2", len(steps))
	}

	if steps[0].Views != 10 {
		t.Errorf("step1 views = %d, want 10", steps[0].Views)
	}
}

func TestAnalytics_UploadAnalytics(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	result := &domain.Analytics{
		TotalViews: 5,
		Steps: []domain.StepAnalytics{
			{StepID: uuid.New(), Title: "S1", OrderNum: 1, Views: 5},
		},
	}

	key, err := infra.UploadAnalytics(ctx, scID, result)
	if err != nil {
		t.Fatalf("upload analytics: %v", err)
	}
	if key == "" {
		t.Error("expected non-empty key")
	}

	if _, ok := s3Client.storage[key]; !ok {
		t.Error("PDF was not uploaded to S3")
	}

	if string(s3Client.storage[key]) != "PDF" {
		t.Errorf("uploaded content = %q, want PDF", string(s3Client.storage[key]))
	}
}

func TestAnalytics_DownloadAnalytics(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	result := &domain.Analytics{
		TotalViews: 2,
		Steps: []domain.StepAnalytics{
			{StepID: uuid.New(), Title: "S1", OrderNum: 1, Views: 2},
		},
	}

	key, err := infra.UploadAnalytics(ctx, scID, result)
	if err != nil {
		t.Fatalf("upload: %v", err)
	}

	reader, err := infra.DownloadAnalytics(ctx, key)
	if err != nil {
		t.Fatalf("download: %v", err)
	}
	defer reader.Close()

	data, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("read download: %v", err)
	}
	if string(data) != "PDF" {
		t.Errorf("downloaded = %q, want PDF", string(data))
	}
}

func TestAnalytics_DownloadAnalytics_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")

	_, err := infra.DownloadAnalytics(ctx, "nonexistent.pdf")
	if err == nil {
		t.Fatal("expected error")
	}
	if !errors.Is(err, domain.ErrReportNotFound) {
		t.Errorf("err = %v, want ErrReportNotFound", err)
	}
}

func TestAnalytics_GetAnalytics_Empty(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, testCH, s3Client, pdfEngine, "reports")
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	result, err := infra.GetScenarioAnalytics(ctx, nil, scID)
	if err != nil {
		t.Fatalf("get analytics: %v", err)
	}
	if result.TotalViews != 0 {
		t.Errorf("totalViews = %d, want 0", result.TotalViews)
	}
	if result.Completed != 0 {
		t.Errorf("completed = %d, want 0", result.Completed)
	}

	steps, err := infra.GetStepAnalytics(ctx, nil, scID)
	if err != nil {
		t.Fatalf("get step analytics: %v", err)
	}
	if len(steps) != 0 {
		t.Errorf("steps count = %d, want 0", len(steps))
	}
}

func createProject(t *testing.T, ctx context.Context) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	testDB.QueryRowContext(ctx, `INSERT INTO project (name, project_key) VALUES ($1, $2) RETURNING id`,
		"Test", fmt.Sprintf("k-%d", time.Now().UnixNano())).Scan(&id)
	return id
}

func createScenario(t *testing.T, ctx context.Context, projID uuid.UUID) uuid.UUID {
	t.Helper()
	s, err := queries.New().CreateScenario(ctx, testDB, gen.CreateScenarioParams{
		ProjectID: projID,
		Name:      "Test",
		Url:       fmt.Sprintf("/%s", uuid.New()),
		Status:    gen.ScenarioStatusDraft,
	})
	if err != nil {
		t.Fatalf("create scenario: %v", err)
	}
	return s.ID
}
