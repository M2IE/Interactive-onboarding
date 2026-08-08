package projects

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
)

type ProjectInfrastructure struct {
	q  *queries.Query
	db database.Database
}

func NewProjectInfrastructure(db database.Database, q *queries.Query) *ProjectInfrastructure {
	return &ProjectInfrastructure{
		q:  q,
		db: db,
	}
}

func (p *ProjectInfrastructure) GetByKey(ctx context.Context, db database.Querier, projectKey string) (*domain.Project, error) {
	row, err := p.q.GetProjectByKey(ctx, p.querier(db), projectKey)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrProjectNotFound
		}

		return nil, err
	}

	return toDomainProject(&row), nil
}

func (p *ProjectInfrastructure) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}

	return p.db
}
