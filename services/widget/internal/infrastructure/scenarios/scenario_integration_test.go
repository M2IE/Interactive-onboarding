//go:build integration

package scenarios

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/tests/dbScenario"
	"github.com/google/uuid"
)

var testDB rdb.Database

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

func TestScenario_GetPublishedByURL(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())
	scID := createScenario(t, ctx, projID, "/test-pub", domain.ScenarioStatusPublished)

	scenario, err := repo.GetPublishedScenarioByURL(ctx, testDB, projID, "/test-pub")
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

	_, err := repo.GetPublishedScenarioByURL(ctx, testDB, projID, "/test-draft")
	if err == nil {
		t.Fatal("expected error for draft scenario")
	}
}

func TestScenario_GetPublishedByURL_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewScenarioRepository(testDB, q)
	projID := createProject(t, ctx, "sc-"+uuid.New().String())

	_, err := repo.GetPublishedScenarioByURL(ctx, testDB, projID, "/nonexistent")
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

	scenario, err := repo.GetScenarioByID(ctx, testDB, scID)
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

	_, err := repo.GetScenarioByID(ctx, testDB, uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
}
