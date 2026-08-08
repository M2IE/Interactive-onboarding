package steps

import (
	"context"
	"log/slog"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IStepsInfrastructure interface {
	GetStepByID(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Step, error)
	GetStepsByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.Step, error)
	CreateStep(ctx context.Context, db database.Querier, step *domain.Step) error
	UpdateStep(ctx context.Context, db database.Querier, step *domain.Step) error
	DeleteStep(ctx context.Context, db database.Querier, id uuid.UUID) error
	GetMaxOrder(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (int, error)
	DecrementOrdersAfter(ctx context.Context, db database.Querier, scenarioID uuid.UUID, afterOrder int) error
	UpdateStepOrder(ctx context.Context, db database.Querier, stepID uuid.UUID, newOrder int) error
	GetScenarioStatus(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (domain.ScenarioStatus, error)
}

type StepsService struct {
	infra     IStepsInfrastructure
	txManager database.Database
}

func NewStepsService(infra IStepsInfrastructure, txManager database.Database) *StepsService {
	return &StepsService{
		infra:     infra,
		txManager: txManager,
	}
}

func (s *StepsService) ensureScenarioNotPublished(ctx context.Context, db database.Querier, scenarioID uuid.UUID) error {
	status, err := s.infra.GetScenarioStatus(ctx, db, scenarioID)
	if err != nil {
		return err
	}
	if status == domain.ScenarioStatusPublished {
		return domain.ErrScenarioPublished
	}
	return nil
}

// CreateStep - создаёт новый шаг в черновике.
func (s *StepsService) CreateStep(ctx context.Context, scenarioID uuid.UUID, selector, title, body string) (*domain.Step, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback create step transaction", "error", rbErr)
			}
		}
	}()

	if err := s.ensureScenarioNotPublished(ctx, tx, scenarioID); err != nil {
		return nil, err
	}

	// Получаем максимальный order_num
	maxOrder, err := s.infra.GetMaxOrder(ctx, tx, scenarioID)
	if err != nil {
		return nil, err
	}
	newOrder := maxOrder + 1

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	step := &domain.Step{
		ID:         id,
		ScenarioID: scenarioID,
		OrderNum:   newOrder,
		Selector:   selector,
		Title:      title,
		Body:       body,
	}

	err = s.infra.CreateStep(ctx, tx, step)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return step, nil
}

// UpdateStep - обновляет поля шага (selector, title, body).
func (s *StepsService) UpdateStep(ctx context.Context, stepID uuid.UUID, selector, title, body *string) (*domain.Step, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback update step transaction", "error", rbErr)
			}
		}
	}()

	// Получаем шаг
	step, err := s.infra.GetStepByID(ctx, tx, stepID)
	if err != nil {
		return nil, err
	}

	if err := s.ensureScenarioNotPublished(ctx, tx, step.ScenarioID); err != nil {
		return nil, err
	}
	// Обновляем только переданные поля
	if selector != nil {
		step.Selector = *selector
	}
	if title != nil {
		step.Title = *title
	}
	if body != nil {
		step.Body = *body
	}

	err = s.infra.UpdateStep(ctx, tx, step)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return step, nil
}

// DeleteStep - удаляет шаг и перестраивает порядок оставшихся.
func (s *StepsService) DeleteStep(ctx context.Context, stepID uuid.UUID) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback delete step transaction", "error", rbErr)
			}
		}
	}()

	// Получаем шаг (чтобы узнать scenario_id и order_num)
	step, err := s.infra.GetStepByID(ctx, tx, stepID)
	if err != nil {
		return err
	}

	if err := s.ensureScenarioNotPublished(ctx, tx, step.ScenarioID); err != nil {
		return err
	}

	// Удаляем шаг
	err = s.infra.DeleteStep(ctx, tx, stepID)
	if err != nil {
		return err
	}

	// Сдвигаем все последующие шаги
	err = s.infra.DecrementOrdersAfter(ctx, tx, step.ScenarioID, step.OrderNum)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// ReorderSteps - массовое обновление порядка шагов.
func (s *StepsService) ReorderSteps(ctx context.Context, scenarioID uuid.UUID, items []domain.ReorderItem) error {
	tx, err := s.txManager.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback reorder transaction", "error", rbErr)
			}
		}
	}()

	if err := s.ensureScenarioNotPublished(ctx, tx, scenarioID); err != nil {
		return err
	}
	// Проверяем, что все шаги принадлежат сценарию, и номера уникальны
	existingSteps, err := s.infra.GetStepsByScenario(ctx, tx, scenarioID)
	if err != nil {
		return err
	}

	// Проверяем, что число переданных шагов совпадает с тем, что есть у сценария
	if len(items) != len(existingSteps) {
		return domain.ErrMissingSteps
	}

	existingMap := make(map[uuid.UUID]bool)
	for _, st := range existingSteps {
		existingMap[st.ID] = true
	}

	orderSet := make(map[int]bool)
	for _, item := range items {
		if !existingMap[item.StepID] {
			return domain.ErrStepNotFound
		}
		if orderSet[item.NewOrder] {
			return domain.ErrDuplicateOrder
		}
		orderSet[item.NewOrder] = true
	}

	// Обновляем порядок для каждого шага
	for _, item := range items {
		err = s.infra.UpdateStepOrder(ctx, tx, item.StepID, item.NewOrder)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
