//go:build integration

package steps

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/tests/admin"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

var testDB database.Database

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

func TestSteps_CreateAndGet(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewStepsInfrastructure(testDB, q)
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	step := &domain.Step{
		ID:         uuid.New(),
		ScenarioID: scID,
		OrderNum:   1,
		Selector:   "#test",
		Title:      "Test Step",
		Body:       "Test Body",
	}
	err := infra.CreateStep(ctx, nil, step)
	if err != nil {
		t.Fatalf("create step: %v", err)
	}

	got, err := infra.GetStepByID(ctx, nil, step.ID)
	if err != nil {
		t.Fatalf("get step: %v", err)
	}
	if got.Title != step.Title {
		t.Errorf("title = %q, want %q", got.Title, step.Title)
	}
}

func TestSteps_GetNotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewStepsInfrastructure(testDB, q)

	_, err := infra.GetStepByID(ctx, nil, uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestSteps_GetMaxOrder(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewStepsInfrastructure(testDB, q)
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	for i := 1; i <= 3; i++ {
		err := infra.CreateStep(ctx, nil, &domain.Step{
			ID: uuid.New(), ScenarioID: scID, OrderNum: i,
			Selector: "#s", Title: "S", Body: "B",
		})
		if err != nil {
			t.Fatalf("create step %d: %v", i, err)
		}
	}

	max, err := infra.GetMaxOrder(ctx, nil, scID)
	if err != nil {
		t.Fatalf("max order: %v", err)
	}
	if max != 3 {
		t.Errorf("max order = %d, want 3", max)
	}
}

func TestSteps_GetScenarioStatus(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewStepsInfrastructure(testDB, q)
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	status, err := infra.GetScenarioStatus(ctx, nil, scID)
	if err != nil {
		t.Fatalf("get status: %v", err)
	}
	if status != domain.ScenarioStatusDraft {
		t.Errorf("status = %q, want draft", status)
	}
}

func TestSteps_DeleteAndReorder(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewStepsInfrastructure(testDB, q)
	projID := createProject(t, ctx)
	scID := createScenario(t, ctx, projID)

	step1 := &domain.Step{ID: uuid.New(), ScenarioID: scID, OrderNum: 1, Selector: "#1", Title: "One", Body: "B"}
	step2 := &domain.Step{ID: uuid.New(), ScenarioID: scID, OrderNum: 2, Selector: "#2", Title: "Two", Body: "B"}
	infra.CreateStep(ctx, nil, step1)
	infra.CreateStep(ctx, nil, step2)

	err := infra.DeleteStep(ctx, nil, step1.ID)
	if err != nil {
		t.Fatalf("delete: %v", err)
	}

	err = infra.UpdateStepOrder(ctx, nil, step2.ID, 1)
	if err != nil {
		t.Fatalf("reorder: %v", err)
	}

	got, err := infra.GetStepByID(ctx, nil, step2.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.OrderNum != 1 {
		t.Errorf("order = %d, want 1", got.OrderNum)
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
