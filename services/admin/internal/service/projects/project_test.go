package projects

import (
	"context"
	"errors"
	"testing"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

var testProjectID = uuid.MustParse("650e8400-e29b-41d4-a716-446655440001")

type mockInfra struct {
	getKey  string
	getResp *domain.Project
	getErr  error
}

func (m *mockInfra) GetByKey(_ context.Context, _ database.Querier, projectKey string) (*domain.Project, error) {
	m.getKey = projectKey
	return m.getResp, m.getErr
}

func TestGetByKey_Success(t *testing.T) {
	want := &domain.Project{ID: testProjectID, Name: "Onboarding", ProjectKey: "interactive-onboarding"}
	infra := &mockInfra{getResp: want}
	svc := NewProjectService(infra)

	got, err := svc.GetByKey(context.Background(), "interactive-onboarding")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != want.ID {
		t.Errorf("result ID = %s, want %s", got.ID, want.ID)
	}
	if infra.getKey != "interactive-onboarding" {
		t.Errorf("getKey = %q, want %q", infra.getKey, "interactive-onboarding")
	}
}

func TestGetByKey_NotFound(t *testing.T) {
	infra := &mockInfra{getErr: domain.ErrProjectNotFound}
	svc := NewProjectService(infra)

	_, err := svc.GetByKey(context.Background(), "unknown")

	if !errors.Is(err, domain.ErrProjectNotFound) {
		t.Errorf("err = %v, want ErrProjectNotFound", err)
	}
}

func TestGetByKey_Error(t *testing.T) {
	infra := &mockInfra{getErr: errors.New("db down")}
	svc := NewProjectService(infra)

	_, err := svc.GetByKey(context.Background(), "interactive-onboarding")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
