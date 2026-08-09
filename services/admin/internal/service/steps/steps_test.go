package steps

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

var testScenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var testStepID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")

func testStep() *domain.Step {
	return &domain.Step{
		ID:         testStepID,
		ScenarioID: testScenarioID,
		OrderNum:   1,
		Selector:   "#welcome",
		Title:      "Welcome",
		Body:       "Welcome body",
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
func (m *mockTx) Commit() error   { m.committed = true; return m.commitErr }
func (m *mockTx) Rollback() error { m.rolledBack = true; return m.rollbackErr }

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
func (m *mockDB) Ping() error  { return nil }
func (m *mockDB) Close() error { return nil }
func (m *mockDB) Begin() (database.Tx, error) {
	if m.beginErr != nil {
		return nil, m.beginErr
	}
	return m.tx, nil
}

type mockInfra struct {
	stepByIDResp    *domain.Step
	stepByIDErr     error
	stepsByScenario []domain.Step
	stepsByScenarioErr error
	createStepErr      error
	updateStepErr      error
	deleteStepErr      error
	maxOrder       int
	maxOrderErr    error
	decrementErr   error
	updateOrderErr error
	scenarioStatus domain.ScenarioStatus
	scenarioStatusErr error
	createdStep    *domain.Step
}

func (m *mockInfra) GetStepByID(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Step, error) {
	return m.stepByIDResp, m.stepByIDErr
}

func (m *mockInfra) GetStepsByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
	return m.stepsByScenario, m.stepsByScenarioErr
}

func (m *mockInfra) CreateStep(ctx context.Context, db database.Querier, step *domain.Step) error {
	m.createdStep = step
	return m.createStepErr
}

func (m *mockInfra) UpdateStep(ctx context.Context, db database.Querier, step *domain.Step) error {
	return m.updateStepErr
}

func (m *mockInfra) DeleteStep(ctx context.Context, db database.Querier, id uuid.UUID) error {
	return m.deleteStepErr
}

func (m *mockInfra) GetMaxOrder(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (int, error) {
	return m.maxOrder, m.maxOrderErr
}

func (m *mockInfra) DecrementOrdersAfter(ctx context.Context, db database.Querier, scenarioID uuid.UUID, afterOrder int) error {
	return m.decrementErr
}

func (m *mockInfra) UpdateStepOrder(ctx context.Context, db database.Querier, stepID uuid.UUID, newOrder int) error {
	return m.updateOrderErr
}

func (m *mockInfra) GetScenarioStatus(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (domain.ScenarioStatus, error) {
	return m.scenarioStatus, m.scenarioStatusErr
}

func newSvc(infra IStepsInfrastructure, db database.Database) *StepsService {
	return NewStepsService(infra, db)
}

// ── CreateStep ───────────────────────────────────────────────────────────────

func TestCreateStep_Success(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioStatus: domain.ScenarioStatusDraft,
		maxOrder:       2,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	step, err := svc.CreateStep(context.Background(), testScenarioID, "#test", "Test", "Body")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if step.OrderNum != 3 {
		t.Errorf("OrderNum = %d, want 3", step.OrderNum)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
}

func TestCreateStep_ScenarioPublished(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioStatus: domain.ScenarioStatusPublished,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.CreateStep(context.Background(), testScenarioID, "#test", "Test", "Body")

	if !errors.Is(err, domain.ErrScenarioPublished) {
		t.Errorf("err = %v, want ErrScenarioPublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestCreateStep_CreateFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioStatus: domain.ScenarioStatusDraft,
		maxOrder:       0,
		createStepErr:  errors.New("insert failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.CreateStep(context.Background(), testScenarioID, "#test", "Test", "Body")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

// ── UpdateStep ───────────────────────────────────────────────────────────────

func TestUpdateStep_Success(t *testing.T) {
	tx := &mockTx{}
	existing := testStep()
	infra := &mockInfra{
		stepByIDResp:   existing,
		scenarioStatus: domain.ScenarioStatusDraft,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	newSelector := "#updated"
	newTitle := "Updated"
	step, err := svc.UpdateStep(context.Background(), testStepID, &newSelector, &newTitle, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if step.Selector != "#updated" {
		t.Errorf("Selector = %q, want #updated", step.Selector)
	}
	if step.Title != "Updated" {
		t.Errorf("Title = %q, want Updated", step.Title)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
}

func TestUpdateStep_NotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		stepByIDErr: domain.ErrStepNotFound,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.UpdateStep(context.Background(), testStepID, nil, nil, nil)

	if !errors.Is(err, domain.ErrStepNotFound) {
		t.Errorf("err = %v, want ErrStepNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUpdateStep_Published(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		stepByIDResp:   testStep(),
		scenarioStatus: domain.ScenarioStatusPublished,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.UpdateStep(context.Background(), testStepID, nil, nil, nil)

	if !errors.Is(err, domain.ErrScenarioPublished) {
		t.Errorf("err = %v, want ErrScenarioPublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

// ── DeleteStep ───────────────────────────────────────────────────────────────

func TestDeleteStep_Success(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		stepByIDResp:   testStep(),
		scenarioStatus: domain.ScenarioStatusDraft,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.DeleteStep(context.Background(), testStepID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
}

func TestDeleteStep_NotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		stepByIDErr: domain.ErrStepNotFound,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.DeleteStep(context.Background(), testStepID)

	if !errors.Is(err, domain.ErrStepNotFound) {
		t.Errorf("err = %v, want ErrStepNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestDeleteStep_Published(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		stepByIDResp:   testStep(),
		scenarioStatus: domain.ScenarioStatusPublished,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.DeleteStep(context.Background(), testStepID)

	if !errors.Is(err, domain.ErrScenarioPublished) {
		t.Errorf("err = %v, want ErrScenarioPublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

// ── ReorderSteps ─────────────────────────────────────────────────────────────

func TestReorderSteps_Success(t *testing.T) {
	tx := &mockTx{}
	step1 := domain.Step{ID: uuid.New(), ScenarioID: testScenarioID, OrderNum: 1}
	step2 := domain.Step{ID: uuid.New(), ScenarioID: testScenarioID, OrderNum: 2}
	infra := &mockInfra{
		scenarioStatus:  domain.ScenarioStatusDraft,
		stepsByScenario: []domain.Step{step1, step2},
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.ReorderSteps(context.Background(), testScenarioID, []domain.ReorderItem{
		{StepID: step2.ID, NewOrder: 1},
		{StepID: step1.ID, NewOrder: 2},
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
}

func TestReorderSteps_MissingSteps(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioStatus:  domain.ScenarioStatusDraft,
		stepsByScenario: []domain.Step{},
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.ReorderSteps(context.Background(), testScenarioID, []domain.ReorderItem{
		{StepID: uuid.New(), NewOrder: 1},
	})

	if !errors.Is(err, domain.ErrMissingSteps) {
		t.Errorf("err = %v, want ErrMissingSteps", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestReorderSteps_DuplicateOrder(t *testing.T) {
	tx := &mockTx{}
	step1 := domain.Step{ID: uuid.New(), ScenarioID: testScenarioID}
	step2 := domain.Step{ID: uuid.New(), ScenarioID: testScenarioID}
	infra := &mockInfra{
		scenarioStatus:  domain.ScenarioStatusDraft,
		stepsByScenario: []domain.Step{step1, step2},
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.ReorderSteps(context.Background(), testScenarioID, []domain.ReorderItem{
		{StepID: step1.ID, NewOrder: 1},
		{StepID: step2.ID, NewOrder: 1},
	})

	if !errors.Is(err, domain.ErrDuplicateOrder) {
		t.Errorf("err = %v, want ErrDuplicateOrder", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}
