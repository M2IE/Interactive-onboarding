package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type ProjectRepository struct {
	q  *queries.Query
	db rdb.Querier
}

func NewProjectRepository(db rdb.Querier, q *queries.Query) *ProjectRepository {
	return &ProjectRepository{q: q, db: db}
}

func (r *ProjectRepository) GetProjectByKey(ctx context.Context, db rdb.Querier, key string) (*domain.Project, error) {
	row, err := r.q.GetProjectByKey(ctx, r.querier(db), key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}
	return toDomainProject(&row), nil
}

func (s *ProjectRepository) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return s.db
}
