package steps

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
	"github.com/google/uuid"
)

type StepRepository struct {
	q  *queries.Query
	db rdb.Database
}

func NewStepRepository(db rdb.Database, q *queries.Query) *StepRepository {
	return &StepRepository{q: q, db: db}
}

func (r *StepRepository) GetStepsByScenario(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) ([]domain.Step, error) {
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

func (r *StepRepository) GetStepByID(ctx context.Context, db rdb.Querier, stepID uuid.UUID) (*domain.Step, error) {
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
func (r *StepRepository) GetMaxOrderByScenario(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (int, error) {
	val, err := r.q.GetMaxOrderByScenario(ctx, r.querier(db), scenarioID)
	if err != nil {
		return 0, err
	}
	return int(val), nil
}

func (s *StepRepository) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return s.db
}

func toDomainStep(row *gen.Step) *domain.Step {
	var nextURL *string
	if row.NextUrl.Valid {
		nextURL = &row.NextUrl.String
	}
	return &domain.Step{
		ID:         row.ID,
		ScenarioID: row.ScenarioID,
		OrderNum:   int(row.OrderNum),
		Selector:   row.Selector,
		Title:      row.Title,
		Body:       row.Body,
		NextURL:    nextURL,
	}
}
