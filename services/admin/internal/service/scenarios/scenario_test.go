package scenarios

import (
	"context"
	"errors"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

var (
	testScenarioID = uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
	testProjectID  = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")
)

func testScenario(status domain.ScenarioStatus) *domain.Scenario {
	return &domain.Scenario{
		ID:        testScenarioID,
		ProjectID: testProjectID,
		Name:      "Onboarding",
		URL:       "/onboard",
		Status:    status,
	}
}

// ── mock infra ───────────────────────────────────────────────────────────────

type mockInfra struct {
	// captured args
	createProjectID uuid.UUID
	createName      string
	createURL       string
	createStatus    domain.ScenarioStatus
	getID           uuid.UUID
	updateID        uuid.UUID
	updateName      *string
	updateURL       *string
	listSize        int
	listPage        int
	listProjectID   *uuid.UUID

	// responses
	scenarioResp *domain.Scenario
	scenarioErr  error
	listResp     []domain.Scenario
	listTotal    int64
	listErr      error
}

func (m *mockInfra) Get(_ context.Context, _ database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	m.getID = id
	return m.scenarioResp, m.scenarioErr
}

func (m *mockInfra) Create(_ context.Context, _ database.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error) {
	m.createProjectID = projectID
	m.createName = name
	m.createURL = url
	m.createStatus = status
	return m.scenarioResp, m.scenarioErr
}

func (m *mockInfra) Update(_ context.Context, _ database.Querier, id uuid.UUID, name, url *string) (*domain.Scenario, error) {
	m.updateID = id
	m.updateName = name
	m.updateURL = url
	return m.scenarioResp, m.scenarioErr
}

func (m *mockInfra) List(_ context.Context, _ database.Querier, size, page int, projectID *uuid.UUID) ([]domain.Scenario, int64, error) {
	m.listSize = size
	m.listPage = page
	m.listProjectID = projectID
	return m.listResp, m.listTotal, m.listErr
}

// ── Create ───────────────────────────────────────────────────────────────────

func TestCreate_Success(t *testing.T) {
	want := testScenario(domain.ScenarioStatusDraft)
	infra := &mockInfra{scenarioResp: want}
	svc := NewScenarioService(infra)

	got, err := svc.Create(context.Background(), domain.CreateScenario{
		ProjectID: testProjectID,
		Name:      "Onboarding",
		Url:       "/onboard",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != want.ID {
		t.Errorf("result ID = %s, want %s", got.ID, want.ID)
	}
	if infra.createStatus != domain.ScenarioStatusDraft {
		t.Errorf("created status = %q, want draft", infra.createStatus)
	}
	if infra.createProjectID != testProjectID || infra.createName != "Onboarding" || infra.createURL != "/onboard" {
		t.Errorf("create args not passed through: projectID=%s name=%q url=%q", infra.createProjectID, infra.createName, infra.createURL)
	}
}

func TestCreate_DraftAlreadyExists(t *testing.T) {
	infra := &mockInfra{scenarioErr: domain.ErrScenarioDraftAlreadyExists}
	svc := NewScenarioService(infra)

	_, err := svc.Create(context.Background(), domain.CreateScenario{ProjectID: testProjectID, Name: "x", Url: "/x"})

	if !errors.Is(err, domain.ErrScenarioDraftAlreadyExists) {
		t.Errorf("err = %v, want ErrScenarioDraftAlreadyExists", err)
	}
}

// ── GetByID ──────────────────────────────────────────────────────────────────

func TestGetByID_Success(t *testing.T) {
	want := testScenario(domain.ScenarioStatusPublished)
	infra := &mockInfra{scenarioResp: want}
	svc := NewScenarioService(infra)

	got, err := svc.GetByID(context.Background(), testScenarioID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != want.ID {
		t.Errorf("result ID = %s, want %s", got.ID, want.ID)
	}
	if infra.getID != testScenarioID {
		t.Errorf("getID = %s, want %s", infra.getID, testScenarioID)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	infra := &mockInfra{scenarioErr: domain.ErrScenarioNotFound}
	svc := NewScenarioService(infra)

	_, err := svc.GetByID(context.Background(), testScenarioID)

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
}

// ── Update ───────────────────────────────────────────────────────────────────

func TestUpdate_Success(t *testing.T) {
	want := testScenario(domain.ScenarioStatusDraft)
	infra := &mockInfra{scenarioResp: want}
	svc := NewScenarioService(infra)

	name := "New name"
	got, err := svc.Update(context.Background(), testScenarioID, domain.UpdateScenario{Name: &name})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != want.ID {
		t.Errorf("result ID = %s, want %s", got.ID, want.ID)
	}
	if infra.updateID != testScenarioID {
		t.Errorf("updateID = %s, want %s", infra.updateID, testScenarioID)
	}
	if infra.updateName == nil || *infra.updateName != "New name" {
		t.Errorf("updateName not passed through: %v", infra.updateName)
	}
}

func TestUpdate_NotEditable(t *testing.T) {
	infra := &mockInfra{scenarioErr: domain.ErrScenarioNotEditable}
	svc := NewScenarioService(infra)

	_, err := svc.Update(context.Background(), testScenarioID, domain.UpdateScenario{})

	if !errors.Is(err, domain.ErrScenarioNotEditable) {
		t.Errorf("err = %v, want ErrScenarioNotEditable", err)
	}
}

func TestUpdate_NotFound(t *testing.T) {
	infra := &mockInfra{scenarioErr: domain.ErrScenarioNotFound}
	svc := NewScenarioService(infra)

	_, err := svc.Update(context.Background(), testScenarioID, domain.UpdateScenario{})

	if !errors.Is(err, domain.ErrScenarioNotFound) {
		t.Errorf("err = %v, want ErrScenarioNotFound", err)
	}
}

// ── List ─────────────────────────────────────────────────────────────────────

func TestList_Success(t *testing.T) {
	want := []domain.Scenario{*testScenario(domain.ScenarioStatusDraft)}
	infra := &mockInfra{listResp: want, listTotal: 42}
	svc := NewScenarioService(infra)

	projectID := testProjectID
	got, total, err := svc.List(context.Background(), domain.ListScenarios{
		ProjectID: &projectID,
		Size:      20,
		Page:      2,
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 42 {
		t.Errorf("got %d scenarios, total %d; want 1, 42", len(got), total)
	}
	if infra.listSize != 20 || infra.listPage != 2 {
		t.Errorf("list args: size=%d page=%d, want 20, 2", infra.listSize, infra.listPage)
	}
	if infra.listProjectID == nil || *infra.listProjectID != testProjectID {
		t.Errorf("listProjectID not passed through: %v", infra.listProjectID)
	}
}

func TestList_Error(t *testing.T) {
	infra := &mockInfra{listErr: errors.New("db down")}
	svc := NewScenarioService(infra)

	_, _, err := svc.List(context.Background(), domain.ListScenarios{Size: 20, Page: 1})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
