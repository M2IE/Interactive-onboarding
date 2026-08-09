//go:build integration

package analytics

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/tests/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

var testDB database.Database

type mockS3 struct{ storage map[string][]byte }

func (m *mockS3) Upload(ctx context.Context, bucket, key string, body io.Reader, contentType string) error {
	data, _ := io.ReadAll(body)
	m.storage[key] = data
	return nil
}
func (m *mockS3) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	data, ok := m.storage[key]
	if !ok {
		return nil, fmt.Errorf("not found: %s", key)
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

	db, cleanup, err := admin.StartPostgres(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "setup: %v\n", err)
		os.Exit(1)
	}
	testDB = db
	code := m.Run()
	cleanup()
	os.Exit(code)
}

func TestAnalytics_ScenarioExists(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	s3Client := &mockS3{storage: make(map[string][]byte)}
	pdfEngine := &mockPDF{}
	infra := NewAnalyticsInfrastructure(testDB, q, s3Client, pdfEngine, "reports")
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
	infra := NewAnalyticsInfrastructure(testDB, q, s3Client, pdfEngine, "reports")
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

	for i := 0; i < 10; i++ {
		testDB.ExecContext(ctx, `INSERT INTO event (id, project_id, scenario_id, step_id, session_id, type, event_key, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())`,
			uuid.New(), projID, scID, step1ID, fmt.Sprintf("s%d", i), "step_viewed", uuid.New())
	}
	for i := 0; i < 3; i++ {
		testDB.ExecContext(ctx, `INSERT INTO event (id, project_id, scenario_id, step_id, session_id, type, event_key, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())`,
			uuid.New(), projID, scID, uuid.NullUUID{}, fmt.Sprintf("c%d", i), "scenario_completed", uuid.New())
	}

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
