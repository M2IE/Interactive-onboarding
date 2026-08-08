package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/google/uuid"
)

type IWidgetInfrastructure interface {
	InsertEvent(ctx context.Context, event *domain.Event) error
	GetProjectByKey(ctx context.Context, key string) (*domain.Project, error)
	GetPublishedScenarioByURL(ctx context.Context, projectID uuid.UUID, url string) (*domain.Scenario, error)
	GetScenarioByID(ctx context.Context, id uuid.UUID) (*domain.Scenario, error)
	GetStepsByScenario(ctx context.Context, scenarioID uuid.UUID) ([]domain.Step, error)
	GetStepByID(ctx context.Context, stepID uuid.UUID) (*domain.Step, error)
	GetMaxOrderByScenario(ctx context.Context, scenarioID uuid.UUID) (int, error)
}

type WidgetService struct {
	infra     IWidgetInfrastructure
	txManager database.Database
}

func NewWidgetService(infra IWidgetInfrastructure, txManager database.Database) *WidgetService {
	return &WidgetService{
		infra:     infra,
		txManager: txManager,
	}
}

// GetScenario возвращает опубликованный сценарий и его шаги для заданного проекта и URL.
func (s *WidgetService) GetScenario(ctx context.Context, projectKey, pageUrl string) (*domain.Scenario, []domain.Step, error) {
	project, err := s.infra.GetProjectByKey(ctx, projectKey)
	if err != nil {
		if errors.Is(err, domain.ErrProjectNotFound) {
			return nil, nil, domain.ErrProjectNotFound
		}
		return nil, nil, fmt.Errorf("get project by key: %w", err)
	}

	scenario, err := s.infra.GetPublishedScenarioByURL(ctx, project.ID, pageUrl)
	if err != nil {
		if errors.Is(err, domain.ErrNoPublishedScenario) {
			return nil, nil, domain.ErrNoPublishedScenario
		}
		return nil, nil, fmt.Errorf("get published scenario: %w", err)
	}

	// 3. Получаем шаги сценария
	steps, err := s.infra.GetStepsByScenario(ctx, scenario.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("get steps: %w", err)
	}

	return scenario, steps, nil
}

func (s *WidgetService) ProcessEvent(ctx context.Context, sessionID string, eventType domain.EventType, stepID, scenarioID *uuid.UUID, eventKey *string) error {
	// Валидация обязательных полей
	switch eventType {
	case domain.StepViewed, domain.StepCompleted:
		if stepID == nil {
			return domain.ErrMissingStepID
		}
	case domain.ScenarioDismissed:
		if scenarioID == nil {
			return domain.ErrMissingScenarioID
		}
	default:
		return domain.ErrInvalidEventType
	}

	// Генерация event_key
	key := ""
	if eventKey != nil && *eventKey != "" {
		key = *eventKey
	} else {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generate event key: %w", err)
		}
		key = id.String()
	}

	// Получение project_id и scenario_id
	var projectID uuid.UUID
	var scID uuid.UUID
	if scenarioID != nil {
		scID = *scenarioID
		scenario, err := s.infra.GetScenarioByID(ctx, scID)
		if err != nil {
			return fmt.Errorf("get scenario by id: %w", err)
		}
		projectID = scenario.ProjectID
	} else if stepID != nil {
		step, err := s.infra.GetStepByID(ctx, *stepID)
		if err != nil {
			return fmt.Errorf("get step by id: %w", err)
		}
		scID = step.ScenarioID
		scenario, err := s.infra.GetScenarioByID(ctx, scID)
		if err != nil {
			return fmt.Errorf("get scenario by id: %w", err)
		}
		projectID = scenario.ProjectID
	} else {
		return domain.ErrMissingScenarioOrStepID
	}

	// Создание основного события
	id, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("generate event id: %w", err)
	}
	ev := &domain.Event{
		ID:         id,
		ProjectID:  projectID,
		ScenarioID: &scID,
		StepID:     stepID,
		SessionID:  sessionID,
		Type:       eventType,
		EventKey:   key,
	}
	if err := s.infra.InsertEvent(ctx, ev); err != nil {
		return fmt.Errorf("insert event: %w", err)
	}

	// Если это step_completed, проверяем, является ли шаг последним(чтобы создать событие о завершении сценария)
	if eventType == domain.StepCompleted && stepID != nil {
		step, err := s.infra.GetStepByID(ctx, *stepID)
		if err != nil {
			return fmt.Errorf("get step by id: %w", err)
		}

		maxOrder, err := s.infra.GetMaxOrderByScenario(ctx, scID)
		if err != nil {
			return fmt.Errorf("get max order: %w", err)
		}

		if step.OrderNum == maxOrder {
			scenarioCompletedKey, err := uuid.NewV7()
			if err != nil {
				return fmt.Errorf("generate scenario completed key: %w", err)
			}
			id, err := uuid.NewV7()
			if err != nil {
				return fmt.Errorf("generate scenario completed id: %w", err)
			}
			scEvent := &domain.Event{
				ID:         id,
				ProjectID:  projectID,
				ScenarioID: &scID,
				StepID:     nil,
				SessionID:  sessionID,
				Type:       domain.ScenarioCompleted,
				EventKey:   scenarioCompletedKey.String(),
			}
			if err := s.infra.InsertEvent(ctx, scEvent); err != nil {
				return fmt.Errorf("insert scenario_completed event: %w", err)
			}
		}
	}

	return nil
}
