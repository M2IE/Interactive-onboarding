//go:build integration

package publishes

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
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

func TestPublish_CreateAndGetScenario(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewPublishInfrastructure(testDB, q)

	projID := createProject(t, ctx)
	s, err := infra.CreateScenario(ctx, nil, projID, "Test", "/test", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create scenario: %v", err)
	}
	if s.Status != domain.ScenarioStatusDraft {
		t.Errorf("status = %q, want draft", s.Status)
	}

	got, err := infra.GetScenario(ctx, nil, s.ID)
	if err != nil {
		t.Fatalf("get scenario: %v", err)
	}
	if got.Name != "Test" {
		t.Errorf("name = %q, want Test", got.Name)
	}
}

func TestPublish_GetScenarioNotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewPublishInfrastructure(testDB, q)

	_, err := infra.GetScenario(ctx, nil, uuid.New())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestPublish_ArchiveAndPublish(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewPublishInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	draft, err := infra.CreateScenario(ctx, nil, projID, "PubTest", "/pub-test", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create draft: %v", err)
	}

	published, err := infra.CreateScenario(ctx, nil, projID, "PubTest", "/pub-test", domain.ScenarioStatusPublished)
	if err != nil {
		t.Fatalf("create published: %v", err)
	}

	rows, err := infra.ArchiveByProjectAndStatus(ctx, nil, projID, domain.ScenarioStatusPublished, "/pub-test")
	if err != nil {
		t.Fatalf("archive: %v", err)
	}
	if rows == 0 {
		t.Error("expected at least 1 archived row")
	}
	_ = published

	err = infra.UpdateScenarioStatus(ctx, nil, draft.ID, domain.ScenarioStatusPublished)
	if err != nil {
		t.Fatalf("update status: %v", err)
	}

	updated, err := infra.GetScenario(ctx, nil, draft.ID)
	if err != nil {
		t.Fatalf("get updated: %v", err)
	}
	if updated.Status != domain.ScenarioStatusPublished {
		t.Errorf("status = %q, want published", updated.Status)
	}
}

func TestPublish_CopySteps(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewPublishInfrastructure(testDB, q)
	projID := createProject(t, ctx)

	src, err := infra.CreateScenario(ctx, nil, projID, "Src", "/src", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create src: %v", err)
	}
	dst, err := infra.CreateScenario(ctx, nil, projID, "Dst", "/dst", domain.ScenarioStatusDraft)
	if err != nil {
		t.Fatalf("create dst: %v", err)
	}

	// Create a step on src
	_, err = q.CreateStep(ctx, testDB, gen.CreateStepParams{
		ID:         uuid.New(),
		ScenarioID: src.ID,
		OrderNum:   1,
		Selector:   "#s",
		Title:      "Title",
		Body:       "Body",
	})
	if err != nil {
		t.Fatalf("insert step: %v", err)
	}

	err = infra.CopyStepsToScenario(ctx, nil, dst.ID, src.ID)
	if err != nil {
		t.Fatalf("copy steps: %v", err)
	}
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
