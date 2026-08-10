package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
	"github.com/google/uuid"
)

type ScenarioRepository struct {
	q  *queries.Query
	db database.Querier
}

func NewScenarioRepository(db database.Querier, q *queries.Query) *ScenarioRepository {
	return &ScenarioRepository{q: q, db: db}
}

func (r *ScenarioRepository) GetPublishedScenarioByURL(ctx context.Context, db database.Querier, projectID uuid.UUID, url string) (*domain.Scenario, error) {
	row, err := r.q.GetPublishedScenarioByURL(ctx, r.querier(db), gen.GetPublishedScenarioByURLParams{
		ProjectID: projectID,
		Url:       url,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNoPublishedScenario
		}
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (r *ScenarioRepository) GetScenarioByID(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	row, err := r.q.GetScenarioByID(ctx, r.querier(db), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrScenarioNotFound
		}
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (s *ScenarioRepository) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}
	return s.db
}
