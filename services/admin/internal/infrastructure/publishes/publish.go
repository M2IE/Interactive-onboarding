package publishes

import (
	"context"
	"database/sql"
	"errors"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/google/uuid"
)

type PublishInfrastructure struct {
	q  *queries.Query
	db rdb.Querier
}

func NewPublishInfrastructure(db rdb.Querier, q *queries.Query) *PublishInfrastructure {
	return &PublishInfrastructure{
		q:  q,
		db: db,
	}
}

func (p *PublishInfrastructure) GetScenario(ctx context.Context, db rdb.Querier, id uuid.UUID) (*domain.Scenario, error) {
	row, err := p.q.GetScenario(ctx, p.querier(db), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrScenarioNotFound
		}
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (p *PublishInfrastructure) CreateScenario(ctx context.Context, db rdb.Querier, projectID uuid.UUID, name, url string, status domain.ScenarioStatus) (*domain.Scenario, error) {
	row, err := p.q.CreateScenario(ctx, p.querier(db), toGenCreateScenarioParams(projectID, name, url, status))
	if err != nil {
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (p *PublishInfrastructure) UpdateScenarioStatus(ctx context.Context, db rdb.Querier, id uuid.UUID, status domain.ScenarioStatus) error {
	return p.q.UpdateScenarioStatusById(ctx, p.querier(db), toGenUpdateStatusParams(id, status))
}

func (p *PublishInfrastructure) ArchiveByProjectAndStatus(ctx context.Context, db rdb.Querier, projectID uuid.UUID, status domain.ScenarioStatus, url string) (int64, error) {
	return p.q.ArchiveByProjectAndStatus(ctx, p.querier(db), toGenArchiveParams(projectID, status, url))
}

func (p *PublishInfrastructure) CopyStepsToScenario(ctx context.Context, db rdb.Querier, destScenarioID, srcScenarioID uuid.UUID) error {
	return p.q.CopyStepsToScenario(ctx, p.querier(db), toGenCopyStepsParams(destScenarioID, srcScenarioID))
}

func (p *PublishInfrastructure) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return p.db
}
