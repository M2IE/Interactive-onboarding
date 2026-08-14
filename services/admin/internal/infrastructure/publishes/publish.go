package publishes

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

type PublishInfrastructure struct {
	q  *queries.Query
	db rdb.Querier
}

func (p *PublishInfrastructure) GetScenarioByProjectURLAndStatus(
	ctx context.Context,
	db rdb.Querier,
	projectID uuid.UUID,
	url string,
	status domain.ScenarioStatus,
) (*domain.Scenario, error) {
	row, err := p.q.GetScenarioByProjectURLAndStatus(
		ctx,
		p.querier(db),
		gen.GetScenarioByProjectURLAndStatusParams{
			ProjectID: projectID,
			Url:       url,
			Status:    gen.ScenarioStatus(status),
		},
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return toDomainScenario(&row), nil
}

func (p *PublishInfrastructure) GetFlowMembership(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.FlowScenario, error) {
	row, err := p.q.GetFlowScenarioMembership(ctx, p.querier(db), scenarioID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &domain.FlowScenario{
		FlowID:     row.FlowID,
		ScenarioID: row.ScenarioID,
		OrderNum:   int(row.OrderNum),
	}, nil
}

func (p *PublishInfrastructure) DetachScenarioFromFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID) error {
	return p.q.RemoveScenarioFromFlow(ctx, p.querier(db), gen.RemoveScenarioFromFlowParams{
		FlowID: flowID, ScenarioID: scenarioID,
	})
}

func (p *PublishInfrastructure) AttachScenarioToFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID, orderNum int) error {
	return p.q.AddScenarioToFlow(ctx, p.querier(db), gen.AddScenarioToFlowParams{
		FlowID: flowID, ScenarioID: scenarioID, OrderNum: int32(orderNum),
	})
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
