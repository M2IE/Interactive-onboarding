package steps

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

type StepsInfrastructure struct {
	q  *queries.Query
	db rdb.Querier
}

func NewStepsInfrastructure(db rdb.Querier, q *queries.Query) *StepsInfrastructure {
	return &StepsInfrastructure{
		q:  q,
		db: db,
	}
}

func (s *StepsInfrastructure) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return s.db
}

// GetStepByID возвращает шаг по ID.
func (s *StepsInfrastructure) GetStepByID(ctx context.Context, db rdb.Querier, id uuid.UUID) (*domain.Step, error) {
	row, err := s.q.GetStepByID(ctx, s.querier(db), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrStepNotFound
		}
		return nil, err
	}
	return toDomainStep(&row), nil
}

// GetStepsByScenario возвращает все шаги сценария, отсортированные по order_num.
func (s *StepsInfrastructure) GetStepsByScenario(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
	rows, err := s.q.GetStepsByScenario(ctx, s.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}
	steps := make([]domain.Step, len(rows))
	for i, row := range rows {
		steps[i] = *toDomainStep(&row)
	}
	return steps, nil
}

// CreateStep вставляет новый шаг.
func (s *StepsInfrastructure) CreateStep(ctx context.Context, db rdb.Querier, step *domain.Step) error {
	params := toGenCreateStepParams(step)
	_, err := s.q.CreateStep(ctx, s.querier(db), params)
	return err
}

// UpdateStep обновляет поля шага (без order_num).
func (s *StepsInfrastructure) UpdateStep(ctx context.Context, db rdb.Querier, step *domain.Step) error {
	params := toGenUpdateStepParams(step)
	return s.q.UpdateStep(ctx, s.querier(db), params)
}

// DeleteStep удаляет шаг
func (s *StepsInfrastructure) DeleteStep(ctx context.Context, db rdb.Querier, id uuid.UUID) error {
	return s.q.DeleteStep(ctx, s.querier(db), id)
}

// GetMaxOrder возвращает максимальный порядковый номер для сценария.
func (s *StepsInfrastructure) GetMaxOrder(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (int, error) {
	val, err := s.q.GetMaxOrderByScenario(ctx, s.querier(db), scenarioID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}

	return int(val), nil
}

// DecrementOrdersAfter сдвигает все order_num > удаленного номера на -1.
func (s *StepsInfrastructure) DecrementOrdersAfter(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID, afterOrder int) error {
	params := gen.DecrementOrdersAfterParams{
		ScenarioID: scenarioID,
		OrderNum:   int32(afterOrder),
	}
	return s.q.DecrementOrdersAfter(ctx, s.querier(db), params)
}

// UpdateStepOrder обновляет order_num для одного шага (используется в Reorder).
func (s *StepsInfrastructure) UpdateStepOrder(ctx context.Context, db rdb.Querier, stepID uuid.UUID, newOrder int) error {
	params := gen.UpdateStepOrderParams{
		ID:       stepID,
		OrderNum: int32(newOrder),
	}
	return s.q.UpdateStepOrder(ctx, s.querier(db), params)
}

// GetScenarioStatus возвращает статус сценария.
func (s *StepsInfrastructure) GetScenarioStatus(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (domain.ScenarioStatus, error) {
	status, err := s.q.GetScenarioStatus(ctx, s.querier(db), scenarioID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", domain.ErrScenarioNotFound
		}
		return "", err
	}
	return domain.ScenarioStatus(status), nil
}
