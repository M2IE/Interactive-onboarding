package publishes

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

// ── fixtures ─────────────────────────────────────────────────────────────────

var scenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

func testScenario(status domain.ScenarioStatus) *domain.Scenario {
	return &domain.Scenario{
		ID:        scenarioID,
		ProjectID: uuid.MustParse("650e8400-e29b-41d4-a716-446655440001"),
		Name:      "Profile",
		URL:       "/profile",
		Status:    status,
		VersionID: uuid.MustParse("750e8400-e29b-41d4-a716-446655440002"),
		Version:   1,
		IsActive:  false,
	}
}

// ── mocks ────────────────────────────────────────────────────────────────────

type mockTx struct {
	commitErr   error
	rollbackErr error
	committed   bool
	rolledBack  bool
}

func (m *mockTx) ExecContext(context.Context, string, ...interface{}) (sql.Result, error) {
	return nil, nil
}
func (m *mockTx) PrepareContext(context.Context, string) (*sql.Stmt, error) { return nil, nil }
func (m *mockTx) QueryContext(context.Context, string, ...interface{}) (*sql.Rows, error) {
	return nil, nil
}
func (m *mockTx) QueryRowContext(context.Context, string, ...interface{}) *sql.Row { return nil }
func (m *mockTx) Commit() error                                                    { m.committed = true; return m.commitErr }
func (m *mockTx) Rollback() error                                                  { m.rolledBack = true; return m.rollbackErr }

type mockDB struct {
	beginErr error
	tx       *mockTx
}

func (m *mockDB) ExecContext(context.Context, string, ...interface{}) (sql.Result, error) {
	return nil, nil
}
func (m *mockDB) PrepareContext(context.Context, string) (*sql.Stmt, error) { return nil, nil }
func (m *mockDB) QueryContext(context.Context, string, ...interface{}) (*sql.Rows, error) {
	return nil, nil
}
func (m *mockDB) QueryRowContext(context.Context, string, ...interface{}) *sql.Row { return nil }
func (m *mockDB) Ping() error                                                      { return nil }
func (m *mockDB) Close() error                                                     { return nil }
func (m *mockDB) Begin() (database.Tx, error) {
	if m.beginErr != nil {
		return nil, m.beginErr
	}
	return m.tx, nil
}

type mockInfra struct {
	getScenarioResp *domain.Scenario
	getScenarioErr  error
	updateStatusErr error
	updatedStatus   domain.ScenarioStatus
}

func (m *mockInfra) GetScenario(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	return m.getScenarioResp, m.getScenarioErr
}

func (m *mockInfra) UpdateScenarioStatus(ctx context.Context, db database.Querier, id uuid.UUID, status domain.ScenarioStatus) error {
	m.updatedStatus = status
	return m.updateStatusErr
}

func newSvc(infra IPublishInfrastructure, db database.Database) *PublishService {
	return NewPublishService(infra, db)
}

// ── Publish ──────────────────────────────────────────────────────────────────

func TestPublish_Success(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusDraft),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	result, err := svc.Publish(context.Background(), scenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Status != domain.ScenarioStatusPublished {
		t.Errorf("status = %q, want %q", result.Status, domain.ScenarioStatusPublished)
	}
	if !result.IsActive {
		t.Error("IsActive = false, want true")
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
	if infra.updatedStatus != domain.ScenarioStatusPublished {
		t.Errorf("updatedStatus = %q, want %q", infra.updatedStatus, domain.ScenarioStatusPublished)
	}
}

func TestPublish_ScenarioNotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioErr: domain.ErrScenarioNotFound,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), scenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_AlreadyPublished(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusPublished),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), scenarioID)

	if !errors.Is(err, domain.ErrScenarioAlreadyPublished) {
		t.Errorf("err = %v, want ErrScenarioAlreadyPublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_GetScenarioDBError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioErr: errors.New("db connection refused"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_UpdateFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusDraft),
		updateStatusErr: errors.New("update failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_BeginFails(t *testing.T) {
	infra := &mockInfra{}
	svc := newSvc(infra, &mockDB{beginErr: errors.New("no connection")})

	_, err := svc.Publish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestPublish_CommitFails(t *testing.T) {
	tx := &mockTx{commitErr: errors.New("commit failed")}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusDraft),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ── Unpublish ────────────────────────────────────────────────────────────────

func TestUnpublish_Success(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusPublished),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), scenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
	if infra.updatedStatus != domain.ScenarioStatusDraft {
		t.Errorf("updatedStatus = %q, want %q", infra.updatedStatus, domain.ScenarioStatusDraft)
	}
}

func TestUnpublish_ScenarioNotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioErr: domain.ErrScenarioNotFound,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), scenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_AlreadyUnpublished(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusDraft),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), scenarioID)

	if !errors.Is(err, domain.ErrScenarioAlreadyUnpublished) {
		t.Errorf("err = %v, want ErrScenarioAlreadyUnpublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_GetScenarioDBError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioErr: errors.New("db connection refused"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_UpdateFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusPublished),
		updateStatusErr: errors.New("update failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), scenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}
