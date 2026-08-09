//go:build integration

package projects

import (
	"context"
	"errors"
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
	infra := NewProjectInfrastructure(testDB, q)
	key := "pk-" + uuid.New().String()
	projID := createProject(t, ctx, key)

	project, err := infra.GetByKey(ctx, nil, key)
	if err != nil {
		t.Fatalf("get project: %v", err)
	}
	if project.ID != projID {
		t.Errorf("id mismatch")
	}
	if project.ProjectKey != key {
		t.Errorf("key = %q, want %q", project.ProjectKey, key)
	}
}

func TestProject_GetByKey_NotFound(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewProjectInfrastructure(testDB, q)

	_, err := infra.GetByKey(ctx, nil, "nonexistent")
	if !errors.Is(err, domain.ErrProjectNotFound) {
		t.Errorf("err = %v, want ErrProjectNotFound", err)
	}
}

func TestProject_GetByKey_WithTx(t *testing.T) {
	ctx := context.Background()
	q := queries.New()
	infra := NewProjectInfrastructure(testDB, q)
	key := "pk-" + uuid.New().String()
	_ = createProject(t, ctx, key)

	tx, err := testDB.Begin()
	if err != nil {
		t.Fatalf("begin tx: %v", err)
	}
	defer tx.Rollback()

	project, err := infra.GetByKey(ctx, tx, key)
	if err != nil {
		t.Fatalf("get project via tx: %v", err)
	}
	if project.ProjectKey != key {
		t.Errorf("key = %q, want %q", project.ProjectKey, key)
	}
}
