package publishes

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/google/uuid"
)

type PublishInfrastructure struct {
	q  *queries.Query
	db database.Querier
}

func NewPublishInfrastructure(db database.Querier, q *queries.Query) *PublishInfrastructure {
	return &PublishInfrastructure{
		q:  q,
		db: db,
	}
}

func (p *PublishInfrastructure) GetScenario(ctx context.Context, db database.Querier, id uuid.UUID) (*domain.Scenario, error) {
	row, err := p.q.GetScenario(ctx, p.querier(db), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrScenarioNotFound
		}
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (p *PublishInfrastructure) UpdateScenarioStatus(ctx context.Context, db database.Querier, id uuid.UUID, status domain.ScenarioStatus) error {
	return p.q.UpdateScenarioStatus(ctx, p.querier(db), toGenUpdateStatusParams(id, status))
}

func (p *PublishInfrastructure) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}
	return p.db
}
