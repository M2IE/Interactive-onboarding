//go:build integration

package clickhouse

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/tests/dbScenario"
	"github.com/google/uuid"
)

var testCH olap.Database

func TestMain(m *testing.M) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	ch, chCleanup, err := dbScenario.StartClickHouse(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "setup clickhouse: %v\n", err)
		os.Exit(1)
	}
	testCH = ch

	code := m.Run()
	chCleanup()
	os.Exit(code)
}

func TestEvent_Insert_And_ExistsByKey(t *testing.T) {
	ctx := context.Background()
	repo := NewEventRepository(testCH, queries.New())

	scID := uuid.New()
	key := "evt-" + uuid.New().String()
	event := &domain.Event{
		ID:         uuid.New(),
		ProjectID:  uuid.New(),
		ScenarioID: &scID,
		SessionID:  "sess-1",
		Type:       domain.StepViewed,
		EventKey:   key,
	}

	if err := repo.InsertEvent(ctx, nil, event); err != nil {
		t.Fatalf("insert event: %v", err)
	}

	exists, err := repo.ExistsEventByKey(ctx, nil, key)
	if err != nil {
		t.Fatalf("exists by key: %v", err)
	}
	if !exists {
		t.Error("expected inserted event to exist by key")
	}

	exists, err = repo.ExistsEventByKey(ctx, nil, "nonexistent-"+uuid.New().String())
	if err != nil {
		t.Fatalf("exists by key: %v", err)
	}
	if exists {
		t.Error("expected nonexistent key to not exist")
	}
}

func TestEvent_ExistsScenarioCompleted(t *testing.T) {
	ctx := context.Background()
	repo := NewEventRepository(testCH, queries.New())

	scID := uuid.New()
	sessionID := "sess-" + uuid.New().String()
	event := &domain.Event{
		ID:         uuid.New(),
		ProjectID:  uuid.New(),
		ScenarioID: &scID,
		SessionID:  sessionID,
		Type:       domain.ScenarioCompleted,
		EventKey:   "evt-" + uuid.New().String(),
	}

	if err := repo.InsertEvent(ctx, nil, event); err != nil {
		t.Fatalf("insert event: %v", err)
	}

	exists, err := repo.ExistsScenarioCompleted(ctx, nil, sessionID, &scID)
	if err != nil {
		t.Fatalf("exists scenario completed: %v", err)
	}
	if !exists {
		t.Error("expected scenario_completed to exist for this session+scenario")
	}

	otherSc := uuid.New()
	exists, err = repo.ExistsScenarioCompleted(ctx, nil, sessionID, &otherSc)
	if err != nil {
		t.Fatalf("exists scenario completed: %v", err)
	}
	if exists {
		t.Error("expected no scenario_completed for a different scenario")
	}
}
