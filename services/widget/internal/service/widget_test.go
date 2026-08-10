package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/google/uuid"
)

var testProjectID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var testScenarioID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")
var testStepID = uuid.MustParse("750e8400-e29b-41d4-a716-446655440002")

func testProject() *domain.Project {
	return &domain.Project{ID: testProjectID, Name: "Test", ProjectKey: "test-key"}
}

func testScenario() *domain.Scenario {
	return &domain.Scenario{ID: testScenarioID, ProjectID: testProjectID, Name: "Test", URL: "/test", Status: domain.ScenarioStatusPublished}
}

func testSteps() []domain.Step {
	return []domain.Step{
		{ID: testStepID, ScenarioID: testScenarioID, OrderNum: 1, Selector: "#s1", Title: "Step 1", Body: "Body 1"},
		{ID: uuid.New(), ScenarioID: testScenarioID, OrderNum: 2, Selector: "#s2", Title: "Step 2", Body: "Body 2"},
	}
}

// ── mocks ────────────────────────────────────────────────────────────────────

type mockTx struct {
	commitErr   error
	rollbackErr error
	committed   bool
	rolledBack  bool
}

func (m *mockTx) ExecContext(context.Context, string, ...any) (sql.Result, error) {
	return nil, nil
}
func (m *mockTx) PrepareContext(context.Context, string) (*sql.Stmt, error) { return nil, nil }
func (m *mockTx) QueryContext(context.Context, string, ...any) (*sql.Rows, error) {
	return nil, nil
}
func (m *mockTx) QueryRowContext(context.Context, string, ...any) *sql.Row { return nil }
func (m *mockTx) Commit() error                                            { m.committed = true; return m.commitErr }
func (m *mockTx) Rollback() error                                          { m.rolledBack = true; return m.rollbackErr }

type mockDB struct {
	beginErr error
	tx       *mockTx
}

func (m *mockDB) ExecContext(context.Context, string, ...any) (sql.Result, error) {
	return nil, nil
}
func (m *mockDB) PrepareContext(context.Context, string) (*sql.Stmt, error) { return nil, nil }
func (m *mockDB) QueryContext(context.Context, string, ...any) (*sql.Rows, error) {
	return nil, nil
}
func (m *mockDB) QueryRowContext(context.Context, string, ...any) *sql.Row { return nil }
func (m *mockDB) Ping() error                                              { return nil }
func (m *mockDB) Close() error                                             { return nil }
func (m *mockDB) Begin() (database.Tx, error) {
	if m.beginErr != nil {
		return nil, m.beginErr
	}
	return m.tx, nil
}

type mockInfra struct {
	projectResp       *domain.Project
	projectErr        error
	publishedScenario *domain.Scenario
	publishedErr      error
	stepsResp         []domain.Step
	stepsErr          error
	stepByIDResp      *domain.Step
	stepByIDErr       error
	scenarioByIDResp  *domain.Scenario
	scenarioByIDErr   error
	maxOrder          int
	maxOrderErr       error
	insertEventErr    error
	insertedEvent     *domain.Event
}

func (m *mockInfra) InsertEvent(ctx context.Context, db database.Querier, event *domain.Event) error {
	m.insertedEvent = event
	return m.insertEventErr
}

func (m *mockInfra) GetProjectByKey(ctx context.Context, db database.Querier, key string) (*domain.Project, error) {
	return m.projectResp, m.projectErr
}

func (m *mockInfra) GetPublishedScenarioByURL(ctx context.Context, db database.Querier, projectID uuid.UUID, url string) (*domain.Scenario, error) {
	return m.publishedScenario, m.publishedErr
}

func (m *mockInfra) GetScenarioByID(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	return m.scenarioByIDResp, m.scenarioByIDErr
}

func (m *mockInfra) GetStepsByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
	return m.stepsResp, m.stepsErr
}

func (m *mockInfra) GetStepByID(ctx context.Context, db database.Querier, stepID uuid.UUID) (*domain.Step, error) {
	return m.stepByIDResp, m.stepByIDErr
}

func (m *mockInfra) GetMaxOrderByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (int, error) {
	return m.maxOrder, m.maxOrderErr
}

func (m *mockInfra) ExistsEventByKey(ctx context.Context, db database.Querier, eventKey string) (bool, error) {
	return false, nil
}

func (m *mockInfra) ExistsScenarioCompleted(ctx context.Context, db database.Querier, sessionID string, scenarioID *uuid.UUID) (bool, error) {
	return false, nil
}

func newSvc(infra IWidgetInfrastructure, db database.Database) *WidgetService {
	return NewWidgetService(infra, db)
}

// ── GetScenario ──────────────────────────────────────────────────────────────

func TestGetScenario_Success(t *testing.T) {
	infra := &mockInfra{
		projectResp:       testProject(),
		publishedScenario: testScenario(),
		stepsResp:         testSteps(),
	}
	svc := newSvc(infra, &mockDB{})

	scenario, steps, err := svc.GetScenario(context.Background(), "test-key", "/test")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if scenario.ID != testScenarioID {
		t.Errorf("scenario ID mismatch")
	}
	if len(steps) != 2 {
		t.Errorf("steps count = %d, want 2", len(steps))
	}
}

func TestGetScenario_ProjectNotFound(t *testing.T) {
	infra := &mockInfra{
		projectErr: domain.ErrProjectNotFound,
	}
	svc := newSvc(infra, &mockDB{})

	_, _, err := svc.GetScenario(context.Background(), "bad-key", "/test")

	if !errors.Is(err, domain.ErrProjectNotFound) {
		t.Errorf("err = %v, want ErrProjectNotFound", err)
	}
}

func TestGetScenario_NoPublishedScenario(t *testing.T) {
	infra := &mockInfra{
		projectResp:  testProject(),
		publishedErr: domain.ErrNoPublishedScenario,
	}
	svc := newSvc(infra, &mockDB{})

	_, _, err := svc.GetScenario(context.Background(), "test-key", "/test")

	if !errors.Is(err, domain.ErrNoPublishedScenario) {
		t.Errorf("err = %v, want ErrNoPublishedScenario", err)
	}
}

// ── ProcessEvent ─────────────────────────────────────────────────────────────

func TestProcessEvent_StepViewed(t *testing.T) {
	stepID := testStepID
	infra := &mockInfra{
		stepByIDResp:     &domain.Step{ID: stepID, ScenarioID: testScenarioID},
		scenarioByIDResp: &domain.Scenario{ID: testScenarioID, ProjectID: testProjectID},
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.StepViewed, &stepID, nil, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if infra.insertedEvent == nil {
		t.Fatal("event was not inserted")
	}
	if infra.insertedEvent.Type != domain.StepViewed {
		t.Errorf("event type = %q, want step_viewed", infra.insertedEvent.Type)
	}
}

func TestProcessEvent_MissingStepID(t *testing.T) {
	infra := &mockInfra{}
	svc := newSvc(infra, &mockDB{})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.StepViewed, nil, nil, nil)

	if !errors.Is(err, domain.ErrMissingStepID) {
		t.Errorf("err = %v, want ErrMissingStepID", err)
	}
}

func TestProcessEvent_ScenarioDismissed(t *testing.T) {
	scenarioID := testScenarioID
	infra := &mockInfra{
		scenarioByIDResp: &domain.Scenario{ID: testScenarioID, ProjectID: testProjectID},
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.ScenarioDismissed, nil, &scenarioID, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if infra.insertedEvent.Type != domain.ScenarioDismissed {
		t.Errorf("event type = %q, want scenario_dismissed", infra.insertedEvent.Type)
	}
}

func TestProcessEvent_MissingScenarioID(t *testing.T) {
	infra := &mockInfra{}
	svc := newSvc(infra, &mockDB{})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.ScenarioDismissed, nil, nil, nil)

	if !errors.Is(err, domain.ErrMissingScenarioID) {
		t.Errorf("err = %v, want ErrMissingScenarioID", err)
	}
}

func TestProcessEvent_StepCompleted_LastStep(t *testing.T) {
	stepID := testStepID
	infra := &mockInfra{
		stepByIDResp:     &domain.Step{ID: stepID, ScenarioID: testScenarioID, OrderNum: 2},
		scenarioByIDResp: &domain.Scenario{ID: testScenarioID, ProjectID: testProjectID},
		maxOrder:         2,
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.StepCompleted, &stepID, nil, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestProcessEvent_InvalidEventType(t *testing.T) {
	infra := &mockInfra{}
	svc := newSvc(infra, &mockDB{})

	err := svc.ProcessEvent(context.Background(), "session-1", domain.EventType("bad"), nil, nil, nil)

	if !errors.Is(err, domain.ErrInvalidEventType) {
		t.Errorf("err = %v, want ErrInvalidEventType", err)
	}
}
