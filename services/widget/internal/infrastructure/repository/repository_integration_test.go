//go:build integration

package repositories

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/tests/dbScenario"
	"github.com/google/uuid"
)

var testDB database.Database

func TestMain(m *testing.M) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	db, cleanup, err := dbScenario.StartPostgres(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "setup: %v\n", err)
		os.Exit(1)
	}
	testDB = db
	code := m.Run()
	cleanup()
	os.Exit(code)
}

func createProject(t *testing.T, ctx context.Context, key string) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	testDB.QueryRowContext(ctx, `INSERT INTO project (name, project_key) VALUES ($1, $2) RETURNING id`,
		"Test Project", key).Scan(&id)
	return id
}

func createScenario(t *testing.T, ctx context.Context, projID uuid.UUID, url string, status domain.ScenarioStatus) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	testDB.QueryRowContext(ctx,
		`INSERT INTO scenario (project_id, name, url, status) VALUES ($1,$2,$3,$4) RETURNING id`,
		projID, "Test Scenario", url, string(status),
	).Scan(&id)
	return id
}

func createStep(t *testing.T, ctx context.Context, scID uuid.UUID, orderNum int, selector, title, body string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	testDB.ExecContext(ctx,
		`INSERT INTO step (id, scenario_id, order_num, selector, title, body) VALUES ($1,$2,$3,$4,$5,$6)`,
		id, scID, orderNum, selector, title, body,
	)
	return id
}

// ProjectRepository

func TestProject_GetByKey(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewProjectRepository(testDB, q)
	key := "test-key-" + uuid.New().String()
	projID := createProject(t, ctx, key)

	project, err := repo.GetProjectByKey(ctx, key)
	if err != nil {
		t.Fatalf("get project: %v", err)
	}
	if project.ID != projID {
		t.Errorf("id mismatch")
	}
	if project.Name != "Test Project" {
		t.Errorf("name = %q, want Test Project", project.Name)
	}
}

func TestProject_GetByKey_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewProjectRepository(testDB, q)

	_, err := repo.GetProjectByKey(ctx, "nonexistent")
	if err == nil {
		t.Fatal("expected error")
	}
}

// ScenarioRepository

func TestScenario_GetPublishedByURL(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/test-pub", domain.ScenarioStatusPublished)

	scenario, err := repo.GetPublishedScenarioByURL(ctx, projID, "/test-pub")
	if err != nil {
		t.Fatalf("get scenario: %v", err)
	}
	if scenario.ID != scID {
		t.Errorf("id mismatch")
	}
	if scenario.Status != domain.ScenarioStatusPublished {
		t.Errorf("status = %q, want published", scenario.Status)
	}
}

func TestScenario_GetPublishedByURL_DraftOnly(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())
	createScenario(t, ctx, projID, "/test-draft", domain.ScenarioStatusDraft)

	_, err := repo.GetPublishedScenarioByURL(ctx, projID, "/test-draft")
	if err == nil {
		t.Fatal("expected error for draft scenario")
	}
}

func TestScenario_GetPublishedByURL_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())

	_, err := repo.GetPublishedScenarioByURL(ctx, projID, "/nonexistent")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestScenario_GetByID(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/test-id", domain.ScenarioStatusDraft)

	scenario, err := repo.GetScenarioByID(ctx, scID)
	if err != nil {
		t.Fatalf("get scenario: %v", err)
	}
	if scenario.ID != scID {
		t.Errorf("id mismatch")
	}
}

func TestScenario_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)

	_, err := repo.GetScenarioByID(ctx, uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
}

// StepRepository

func TestStep_GetByScenario(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewStepRepository(testDB, q)
	projID := createProject(t, ctx, "st-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/st-test", domain.ScenarioStatusPublished)

	createStep(t, ctx, scID, 1, "#a", "A", "Body A")
	createStep(t, ctx, scID, 2, "#b", "B", "Body B")

	steps, err := repo.GetStepsByScenario(ctx, scID)
	if err != nil {
		t.Fatalf("get steps: %v", err)
	}
	if len(steps) != 2 {
		t.Errorf("steps count = %d, want 2", len(steps))
	}
	if steps[0].OrderNum != 1 {
		t.Errorf("first step order = %d, want 1", steps[0].OrderNum)
	}
}

func TestStep_GetByScenario_Empty(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewStepRepository(testDB, q)
	projID := createProject(t, ctx, "st-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/st-empty", domain.ScenarioStatusPublished)

	steps, err := repo.GetStepsByScenario(ctx, scID)
	if err != nil {
		t.Fatalf("get steps: %v", err)
	}
	if len(steps) != 0 {
		t.Errorf("steps count = %d, want 0", len(steps))
	}
}

func TestStep_GetByID(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewStepRepository(testDB, q)
	projID := createProject(t, ctx, "st-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/st-byid", domain.ScenarioStatusPublished)
	stepID := createStep(t, ctx, scID, 1, "#x", "X", "Body X")

	step, err := repo.GetStepByID(ctx, stepID)
	if err != nil {
		t.Fatalf("get step: %v", err)
	}
	if step.ID != stepID {
		t.Errorf("id mismatch")
	}
}

func TestStep_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewStepRepository(testDB, q)

	_, err := repo.GetStepByID(ctx, uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestStep_GetMaxOrder(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewStepRepository(testDB, q)
	projID := createProject(t, ctx, "st-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/st-max", domain.ScenarioStatusPublished)

	createStep(t, ctx, scID, 1, "#1", "One", "B1")
	createStep(t, ctx, scID, 3, "#3", "Three", "B3")
	createStep(t, ctx, scID, 2, "#2", "Two", "B2")

	max, err := repo.GetMaxOrderByScenario(ctx, scID)
	if err != nil {
		t.Fatalf("get max order: %v", err)
	}
	if max != 3 {
		t.Errorf("max order = %d, want 3", max)
	}
}

// EventRepository

func TestEvent_Insert(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewEventRepository(testDB, q)
	projID := createProject(t, ctx, "ev-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/ev-test", domain.ScenarioStatusPublished)

	scenarioID := scID
	event := &domain.Event{
		ID:         uuid.New(),
		ProjectID:  projID,
		ScenarioID: &scenarioID,
		SessionID:  "session-1",
		Type:       domain.StepViewed,
		EventKey:   uuid.New().String(),
	}

	err := repo.InsertEvent(ctx, event)
	if err != nil {
		t.Fatalf("insert event: %v", err)
	}
}

func TestEvent_Insert_OnConflictNoop(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewEventRepository(testDB, q)
	projID := createProject(t, ctx, "ev-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/ev-dup", domain.ScenarioStatusPublished)

	eventKey := uuid.New().String()
	scenarioID := scID

	event := &domain.Event{
		ID:         uuid.New(),
		ProjectID:  projID,
		ScenarioID: &scenarioID,
		SessionID:  "session-1",
		Type:       domain.StepViewed,
		EventKey:   eventKey,
	}
	if err := repo.InsertEvent(ctx, event); err != nil {
		t.Fatalf("first insert: %v", err)
	}

	event2 := &domain.Event{
		ID:         uuid.New(),
		ProjectID:  projID,
		ScenarioID: &scenarioID,
		SessionID:  "session-1",
		Type:       domain.StepViewed,
		EventKey:   eventKey,
	}
	if err := repo.InsertEvent(ctx, event2); err != nil {
		t.Fatalf("second insert (ON CONFLICT DO NOTHING): %v", err)
	}

	var count int
	testDB.QueryRowContext(ctx, `SELECT COUNT(*) FROM event WHERE event_key = $1`, eventKey).Scan(&count)
	if count != 1 {
		t.Errorf("event count = %d, want 1 (ON CONFLICT should deduplicate)", count)
	}
}
