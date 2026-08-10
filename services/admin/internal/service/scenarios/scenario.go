package scenarios

import (
	"context"
	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IScenarioInfrastructure interface {
	Get(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error)
	GetSteps(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.Step, error)
	Create(ctx context.Context, db database.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error)
	Update(ctx context.Context, db database.Querier, id uuid.UUID, name, url *string) (*domain.Scenario, error)
	List(ctx context.Context, db database.Querier, size, page int, projectID *uuid.UUID) ([]domain.Scenario, int64, error)
}

type ScenarioService struct {
	infra IScenarioInfrastructure
}

func NewScenarioService(infra IScenarioInfrastructure) *ScenarioService {
	return &ScenarioService{
		infra: infra,
	}
}

func (s *ScenarioService) List(ctx context.Context, command domain.ListScenarios) ([]domain.Scenario, int64, error) {
	return s.infra.List(ctx, nil, command.Size, command.Page, command.ProjectID)
}

func (s *ScenarioService) Create(ctx context.Context, command domain.CreateScenario) (*domain.Scenario, error) {
	return s.infra.Create(ctx, nil, command.ProjectID, command.Name, command.Url, domain.ScenarioStatusDraft)
}

func (s *ScenarioService) Update(ctx context.Context, scenarioID uuid.UUID, command domain.UpdateScenario) (*domain.Scenario, error) {
	scenario, err := s.infra.Get(ctx, nil, scenarioID)
	if err != nil {
		return nil, err
	}

	if scenario.Status != domain.ScenarioStatusDraft {
		return nil, domain.ErrScenarioNotEditable
	}

	return s.infra.Update(ctx, nil, scenarioID, command.Name, command.Url)
}

func (s *ScenarioService) GetByID(ctx context.Context, scenarioID uuid.UUID) (*domain.Scenario, []domain.Step, error) {
	scenario, err := s.infra.Get(ctx, nil, scenarioID)
	if err != nil {
		return nil, nil, err
	}

	steps, err := s.infra.GetSteps(ctx, nil, scenarioID)
	if err != nil {
		return nil, nil, err
	}

	return scenario, steps, nil
}
