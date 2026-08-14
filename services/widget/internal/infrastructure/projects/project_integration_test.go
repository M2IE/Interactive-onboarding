//go:build integration

package projects

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
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

func TestProject_GetByKey(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	repo := NewProjectRepository(testDB, q)
	key := "test-key-" + uuid.New().String()
	projID := createProject(t, ctx, key)

	project, err := repo.GetProjectByKey(ctx, testDB, key)
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

	_, err := repo.GetProjectByKey(ctx, testDB, "nonexistent")
	if err == nil {
		t.Fatal("expected error")
	}
}
