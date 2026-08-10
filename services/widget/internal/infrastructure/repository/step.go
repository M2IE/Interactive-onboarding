package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/google/uuid"
)

type StepRepository struct {
	q  *queries.Query
	db database.Querier
}

func NewStepRepository(db database.Querier, q *queries.Query) *StepRepository {
	return &StepRepository{q: q, db: db}
}

func (r *StepRepository) GetStepsByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
	rows, err := r.q.GetStepsByScenario(ctx, r.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}
	steps := make([]domain.Step, len(rows))
	for i, row := range rows {
		steps[i] = *toDomainStep(&row)
	}
	return steps, nil
}

func (r *StepRepository) GetStepByID(ctx context.Context, db database.Querier, stepID uuid.UUID) (*domain.Step, error) {
	row, err := r.q.GetStepByID(ctx, r.querier(db), stepID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrStepNotFound
		}
		return nil, err
	}
	return toDomainStep(&row), nil
}

// в step_repo.go
func (r *StepRepository) GetMaxOrderByScenario(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (int, error) {
	val, err := r.q.GetMaxOrderByScenario(ctx, r.querier(db), scenarioID)
	if err != nil {
		return 0, err
	}
	return int(val), nil
}

func (s *StepRepository) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}
	return s.db
}
