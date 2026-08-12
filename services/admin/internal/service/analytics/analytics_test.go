package analytics

import (
	"context"
	"database/sql"
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

var testScenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

func testAnalytics() *domain.Analytics {
	return &domain.Analytics{
		TotalViews: 10,
		Completed:  2,
		Dismissed:  1,
		Steps: []domain.StepAnalytics{
			{StepID: uuid.New(), Title: "Welcome", OrderNum: 1, Views: 10, Completed: 5},
		},
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
func (m *mockDB) Begin() (rdb.Tx, error) {
	if m.beginErr != nil {
		return nil, m.beginErr
	}
	return m.tx, nil
}

type mockInfra struct {
	scenarioAnalyticsResp *domain.Analytics
	scenarioAnalyticsErr  error
	stepAnalyticsResp     []domain.StepAnalytics
	stepAnalyticsErr      error
	scenarioExists        bool
	scenarioExistsErr     error
	uploadAnalyticsResp   string
	uploadAnalyticsErr    error
	downloadAnalyticsResp io.ReadCloser
	downloadAnalyticsErr  error
}

func (m *mockInfra) GetScenarioAnalytics(ctx context.Context, db rdb.Querier, id uuid.UUID) (*domain.Analytics, error) {
	return m.scenarioAnalyticsResp, m.scenarioAnalyticsErr
}

func (m *mockInfra) GetStepAnalytics(ctx context.Context, db rdb.Querier, id uuid.UUID) ([]domain.StepAnalytics, error) {
	return m.stepAnalyticsResp, m.stepAnalyticsErr
}

func (m *mockInfra) ScenarioExists(ctx context.Context, db rdb.Querier, id uuid.UUID) (bool, error) {
	return m.scenarioExists, m.scenarioExistsErr
}

func (m *mockInfra) UploadAnalytics(ctx context.Context, scenarioID uuid.UUID, analytics *domain.Analytics) (string, error) {
	return m.uploadAnalyticsResp, m.uploadAnalyticsErr
}

func (m *mockInfra) DownloadAnalytics(ctx context.Context, filename string) (io.ReadCloser, error) {
	return m.downloadAnalyticsResp, m.downloadAnalyticsErr
}

func newSvc(infra IAnalyticsInfrastructure, db rdb.Database) *AnalyticsService {
	return NewAnalyticsService(infra, db)
}

// ── GetAnalytics ─────────────────────────────────────────────────────────────

func TestGetAnalytics_Success(t *testing.T) {
	tx := &mockTx{}
	a := testAnalytics()
	infra := &mockInfra{
		scenarioExists:        true,
		scenarioAnalyticsResp: a,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	result, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.TotalViews != 10 {
		t.Errorf("TotalViews = %d, want 10", result.TotalViews)
	}
	if !tx.committed {
		t.Error("tx was not committed")
	}
}

func TestGetAnalytics_ScenarioNotFound(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioExists: false,
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestGetAnalytics_ScenarioExistsError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioExistsErr: errors.New("db error"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestGetAnalytics_ScenarioAnalyticsError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioExists:       true,
		scenarioAnalyticsErr: errors.New("query error"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestGetAnalytics_StepAnalyticsError(t *testing.T) {
	tx := &mockTx{}
	infra := &mockInfra{
		scenarioExists:        true,
		scenarioAnalyticsResp: testAnalytics(),
		stepAnalyticsErr:      errors.New("query error"),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !tx.rolledBack {
		t.Error("tx was not rolled back")
	}
}

func TestGetAnalytics_BeginFails(t *testing.T) {
	infra := &mockInfra{}
	svc := newSvc(infra, &mockDB{beginErr: errors.New("no connection")})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestGetAnalytics_CommitFails(t *testing.T) {
	tx := &mockTx{commitErr: errors.New("commit failed")}
	infra := &mockInfra{
		scenarioExists:        true,
		scenarioAnalyticsResp: testAnalytics(),
	}
	svc := newSvc(infra, &mockDB{tx: tx})

	_, err := svc.GetAnalytics(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ── GenerateReport ───────────────────────────────────────────────────────────

func TestGenerateReport_Success(t *testing.T) {
	infra := &mockInfra{
		scenarioExists:        true,
		scenarioAnalyticsResp: testAnalytics(),
		uploadAnalyticsResp:   "reports/test.pdf",
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	filename, err := svc.GenerateReport(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if filename != "reports/test.pdf" {
		t.Errorf("filename = %q, want %q", filename, "reports/test.pdf")
	}
}

func TestGenerateReport_GetAnalyticsFails(t *testing.T) {
	infra := &mockInfra{
		scenarioExists: false,
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	_, err := svc.GenerateReport(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
}

func TestGenerateReport_UploadFails(t *testing.T) {
	infra := &mockInfra{
		scenarioExists:        true,
		scenarioAnalyticsResp: testAnalytics(),
		uploadAnalyticsErr:    errors.New("upload failed"),
	}
	svc := newSvc(infra, &mockDB{tx: &mockTx{}})

	_, err := svc.GenerateReport(context.Background(), testScenarioID)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ── DownloadReport ───────────────────────────────────────────────────────────

func TestDownloadReport_Success(t *testing.T) {
	r := io.NopCloser(strings.NewReader("pdf content"))
	infra := &mockInfra{
		downloadAnalyticsResp: r,
	}
	svc := newSvc(infra, &mockDB{})

	result, err := svc.DownloadReport(context.Background(), "reports/test.pdf")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil reader")
	}
}

func TestDownloadReport_Error(t *testing.T) {
	infra := &mockInfra{
		downloadAnalyticsErr: errors.New("not found"),
	}
	svc := newSvc(infra, &mockDB{})

	_, err := svc.DownloadReport(context.Background(), "reports/test.pdf")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
