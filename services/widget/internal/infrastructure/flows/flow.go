package flows

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

type FlowRepository struct {
	q  *queries.Query
	db rdb.Database
}

func NewFlowRepository(db rdb.Database, q *queries.Query) *FlowRepository {
	return &FlowRepository{q: q, db: db}
}

func (r *FlowRepository) GetFlowByKey(ctx context.Context, db rdb.Querier, projectID uuid.UUID, flowKey string) (*domain.Flow, error) {
	row, err := r.q.GetFlowByKey(ctx, r.querier(db), gen.GetFlowByKeyParams{
		ProjectID: projectID,
		FlowKey:   flowKey,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrFlowNotFound
		}
		return nil, err
	}
	return toDomainFlow(&row), nil
}

func (r *FlowRepository) GetFlowByScenarioID(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.Flow, error) {
	row, err := r.q.GetFlowByScenarioID(ctx, r.querier(db), scenarioID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrFlowNotFound
		}
		return nil, err
	}
	return toDomainFlow(&row), nil
}

func (r *FlowRepository) GetFlowScenariosWithDetails(ctx context.Context, db rdb.Querier, flowID uuid.UUID) ([]domain.FlowScenarioDetail, error) {
	rows, err := r.q.GetFlowScenariosWithDetails(ctx, r.querier(db), flowID)
	if err != nil {
		return nil, err
	}
	items := make([]domain.FlowScenarioDetail, len(rows))
	for i, row := range rows {
		items[i] = domain.FlowScenarioDetail{
			ScenarioID: row.ScenarioID,
			OrderNum:   int(row.OrderNum),
			Name:       row.Name,
			URL:        row.Url,
			Status:     domain.ScenarioStatus(row.Status),
			StepCount:  int(row.StepCount),
		}
	}
	return items, nil
}

func (s *FlowRepository) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return s.db
}

func toDomainFlow(row *gen.Flow) *domain.Flow {
	return &domain.Flow{
		ID:          row.ID,
		ProjectID:   row.ProjectID,
		Name:        row.Name,
		Description: &row.Description.String,
		FlowKey:     row.FlowKey,
		CreatedAt:   row.CreatedAt,
	}
}
