package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
)

type ProjectRepository struct {
	q  *queries.Query
	db database.Querier
}

func NewProjectRepository(db database.Querier, q *queries.Query) *ProjectRepository {
	return &ProjectRepository{q: q, db: db}
}

func (r *ProjectRepository) GetProjectByKey(ctx context.Context, key string) (*domain.Project, error) {
	row, err := r.q.GetProjectByKey(ctx, r.db, key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}
	return toDomainProject(&row), nil
}
