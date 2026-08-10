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

var testScenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
var testProjectID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")

func testScenario(status domain.ScenarioStatus) *domain.Scenario {
	return &domain.Scenario{
		ID:        testScenarioID,
		ProjectID: testProjectID,
		Name:      "Profile",
		URL:       "/profile",
		Status:    status,
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
	getScenarioResp    *domain.Scenario
	getScenarioErr     error
	createScenarioResp *domain.Scenario
	createScenarioErr  error
	updateStatusErr    error
	archiveErr         error
	archiveRows        int64
	copyStepsErr       error
	createdProjectID   uuid.UUID
	createdName        string
	createdURL         string
	createdStatus      domain.ScenarioStatus
	updatedStatus      domain.ScenarioStatus
	archivedProjectID  uuid.UUID
	archivedStatus     domain.ScenarioStatus
	archivedURL        string
	copiedDestScenarioID uuid.UUID
	copiedSrcScenarioID  uuid.UUID
}

func (m *mockInfra) GetScenario(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	return m.getScenarioResp, m.getScenarioErr
}

func (m *mockInfra) CreateScenario(ctx context.Context, db database.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error) {
	m.createdProjectID = projectID
	m.createdName = name
	m.createdURL = url
	m.createdStatus = status
	if m.createScenarioErr != nil {
		return nil, m.createScenarioErr
	}
	return m.createScenarioResp, nil
}

func (m *mockInfra) UpdateScenarioStatus(ctx context.Context, db database.Querier, id uuid.UUID, status domain.ScenarioStatus) error {
	m.updatedStatus = status
	return m.updateStatusErr
}

func (m *mockInfra) ArchiveByProjectAndStatus(ctx context.Context, db database.Querier, projectID uuid.UUID, status domain.ScenarioStatus, url string) (int64, error) {
	m.archivedProjectID = projectID
	m.archivedStatus = status
	m.archivedURL = url
	return m.archiveRows, m.archiveErr
}

func (m *mockInfra) CopyStepsToScenario(ctx context.Context, db database.Querier, destScenarioID, srcScenarioID uuid.UUID) error {
	m.copiedDestScenarioID = destScenarioID
	m.copiedSrcScenarioID = srcScenarioID
	return m.copyStepsErr
}

func newSvc(infra IPublishInfrastructure, db database.Database) *PublishService {
	return NewPublishService(infra, db)
}

// ── Publish ──────────────────────────────────────────────────────────────────

func TestPublish_Success(t *testing.T) {
	tx := &mockTx{}
	draft := testScenario(domain.ScenarioStatusDraft)
	clone := &domain.Scenario{ID: uuid.New(), ProjectID: testProjectID, Status: domain.ScenarioStatusPublished}
	infra := &mockInfra{
		getScenarioResp:    draft,
		createScenarioResp: clone,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	result, err := svc.Publish(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ID != clone.ID {
		t.Errorf("result ID = %s, want clone ID %s", result.ID, clone.ID)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
	if infra.archivedStatus != domain.ScenarioStatusPublished {
		t.Errorf("old published was not archived, archivedStatus = %q", infra.archivedStatus)
	}
	if infra.copiedSrcScenarioID != draft.ID {
		t.Error("steps were not copied from parent")
	}
}

func TestPublish_FromArchived(t *testing.T) {
	tx := &mockTx{}
	archived := testScenario(domain.ScenarioStatusArchived)
	clone := &domain.Scenario{ID: uuid.New(), ProjectID: testProjectID, Status: domain.ScenarioStatusPublished}
	infra := &mockInfra{
		getScenarioResp:    archived,
		createScenarioResp: clone,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	result, err := svc.Publish(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
	if infra.updatedStatus != domain.ScenarioStatusDraft {
		t.Errorf("parent was not set to draft, updatedStatus = %q", infra.updatedStatus)
	}
	if infra.copiedSrcScenarioID != archived.ID {
		t.Error("steps were not copied from parent")
	}
	_ = result
}

func TestPublish_ScenarioNotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioErr: domain.ErrScenarioNotFound}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_AlreadyPublished(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioResp: testScenario(domain.ScenarioStatusPublished)}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioAlreadyPublished) {
		t.Errorf("err = %v, want ErrScenarioAlreadyPublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_GetScenarioDBError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioErr: errors.New("db connection refused")}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_ArchivePublishedFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusDraft),
		archiveErr:      errors.New("archive failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_ArchiveDraftFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusArchived),
		archiveErr:      errors.New("archive draft failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestPublish_UpdateParentFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusArchived),
		updateStatusErr: errors.New("update failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_CreateCloneFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp:    testScenario(domain.ScenarioStatusDraft),
		createScenarioErr: errors.New("insert failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestPublish_CopyStepsFails(t *testing.T) {
	tx := &mockTx{}
	clone := &domain.Scenario{ID: uuid.New(), ProjectID: testProjectID}
	infra := &mockInfra{
		getScenarioResp:    testScenario(domain.ScenarioStatusDraft),
		createScenarioResp: clone,
		copyStepsErr:       errors.New("copy failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

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

	_, err := svc.Publish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestPublish_CommitFails(t *testing.T) {
	tx := &mockTx{commitErr: errors.New("commit failed")}
	clone := &domain.Scenario{ID: uuid.New(), ProjectID: testProjectID}
	infra := &mockInfra{
		getScenarioResp:    testScenario(domain.ScenarioStatusDraft),
		createScenarioResp: clone,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.Publish(context.Background(), testScenarioID)

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

	err := svc.Unpublish(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
	if infra.updatedStatus != domain.ScenarioStatusDraft {
		t.Errorf("updatedStatus = %q, want %q", infra.updatedStatus, domain.ScenarioStatusDraft)
	}
	if infra.archivedStatus != domain.ScenarioStatusDraft {
		t.Error("old draft was not archived before unpublish")
	}
}

func TestUnpublish_ScenarioNotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioErr: domain.ErrScenarioNotFound}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_AlreadyUnpublished(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioResp: testScenario(domain.ScenarioStatusDraft)}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioAlreadyUnpublished) {
		t.Errorf("err = %v, want ErrScenarioAlreadyUnpublished", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_GetScenarioDBError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{getScenarioErr: errors.New("db connection refused")}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), testScenarioID)

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

	err := svc.Unpublish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestUnpublish_ArchiveFails(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		getScenarioResp: testScenario(domain.ScenarioStatusPublished),
		archiveErr:      errors.New("archive failed"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	err := svc.Unpublish(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}
