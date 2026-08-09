//go:build integration

package scenarios

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
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

func TestScenario_Create(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	s, err := infra.Create(ctx, nil, projID, "Test Scenario", "/create-test", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if s.Status != domain.ScenarioStatusDraft {
		t.Errorf("status = %q, want draft", s.Status)
	}
}

func TestScenario_CreateDuplicateDraft(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)
	projID := createProject(t, ctx)
	url := "/dup-" + uuid.New().String()

	_, err := infra.Create(ctx, nil, projID, "First", url, domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("first create: %v", err)
	}

	_, err = infra.Create(ctx, nil, projID, "Second", url, domain.ScenarioStatusDraft)
	if err == nil {
		t.Fatal("expected duplicate error")
	}
}

func TestScenario_Get(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	created, err := infra.Create(ctx, nil, projID, "Get Test", "/get-test", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := infra.Get(ctx, nil, created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Name != created.Name {
		t.Errorf("name mismatch")
	}
}

func TestScenario_GetNotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)

	_, err := infra.Get(ctx, nil, uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestScenario_Update(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	created, err := infra.Create(ctx, nil, projID, "ToUpdate", "/update-test", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	newName := "Updated Name"
	updated, err := infra.Update(ctx, nil, created.ID, &newName, nil)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Name != newName {
		t.Errorf("name = %q, want %q", updated.Name, newName)
	}
}

func TestScenario_List(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewScenarioInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	url := "/list-" + uuid.New().String()
	for i := 0; i < 3; i++ {
		_, err := infra.Create(ctx, nil, projID, "List", url+fmt.Sprintf("-%d", i), domain.ScenarioStatusDraft)
		if err != nil {
			t.Fatalf("create %d: %v", i, err)
		}
	}

	scenarios, total, err := infra.List(ctx, nil, 10, 1, &projID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if total < 3 {
		t.Errorf("total = %d, want >= 3", total)
	}
	_ = scenarios
}

func createProject(t *testing.T, ctx context.Context) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	err := testDB.QueryRowContext(ctx,
		`INSERT INTO project (name, project_key) VALUES ($1, $2) RETURNING id`,
		"Test Project", fmt.Sprintf("key-%d", time.Now().UnixNano()),
	).Scan(&id)
	if err != nil {
		t.Fatalf("create project: %v", err)
	}
	return id
}
