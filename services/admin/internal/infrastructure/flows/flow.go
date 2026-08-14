package flows

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

type FlowInfrastructure struct {
	q  *queries.Query
	db rdb.Database
}

func NewFlowInfrastructure(db rdb.Database, q *queries.Query) *FlowInfrastructure {
	return &FlowInfrastructure{
		q:  q,
		db: db,
	}
}

func toNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}

// Create
func (r *FlowInfrastructure) CreateFlow(ctx context.Context, db rdb.Querier, flow *domain.Flow) (*domain.Flow, error) {
	flowGen, err := r.q.CreateFlow(ctx, r.querier(db), gen.CreateFlowParams{
		ID:          flow.ID,
		ProjectID:   flow.ProjectID,
		Name:        flow.Name,
		Description: toNullString(flow.Description),
		FlowKey:     flow.FlowKey,
	})

	if err != nil {
		return nil, fmt.Errorf("create flow: %w", err)
	}

	return toDomainFlow(&flowGen), nil
}

// GetFlowByID
func (r *FlowInfrastructure) GetFlowByID(ctx context.Context, db rdb.Querier, id uuid.UUID) (*domain.Flow, error) {
	row, err := r.q.GetFlowByID(ctx, r.querier(db), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrFlowNotFound
		}
		return nil, err
	}
	return toDomainFlow(&row), nil
}

// GetFlowByProject
func (r *FlowInfrastructure) GetFlowByProject(ctx context.Context, db rdb.Querier, projectID uuid.UUID) ([]domain.Flow, error) {
	rows, err := r.q.GetFlowsByProject(ctx, r.querier(db), projectID)
	if err != nil {
		return nil, err
	}
	flows := make([]domain.Flow, len(rows))
	for i, row := range rows {
		flows[i] = *toDomainFlow(&row)
	}
	return flows, nil
}

// GetFlowByKey
func (r *FlowInfrastructure) GetFlowByKey(ctx context.Context, db rdb.Querier, projectID uuid.UUID, key string) (*domain.Flow, error) {
	row, err := r.q.GetFlowByKey(ctx, r.querier(db), gen.GetFlowByKeyParams{
		ProjectID: projectID,
		FlowKey:   key,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrFlowNotFound
		}
		return nil, err
	}
	return toDomainFlow(&row), nil
}

func (r *FlowInfrastructure) GetFlowByScenarioID(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.Flow, error) {
	row, err := r.q.GetFlowByScenarioID(ctx, r.querier(db), scenarioID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrFlowNotFound
		}
		return nil, err
	}
	return toDomainFlow(&row), nil
}

// UpdateFlow
func (r *FlowInfrastructure) UpdateFlow(ctx context.Context, db rdb.Querier, flow *domain.Flow) error {
	err := r.q.UpdateFlow(ctx, r.querier(db), gen.UpdateFlowParams{
		ID:          flow.ID,
		Name:        flow.Name,
		Description: toNullString(flow.Description),
	})
	if err != nil {
		return fmt.Errorf("update flow: %w", err)
	}
	return nil
}

// DeleteFlow
func (r *FlowInfrastructure) DeleteFlow(ctx context.Context, db rdb.Querier, id uuid.UUID) error {
	err := r.q.DeleteFlow(ctx, r.querier(db), id)
	if err != nil {
		return fmt.Errorf("delete flow: %w", err)
	}
	return nil
}

// AddScenarioToFlow
func (r *FlowInfrastructure) AddScenarioToFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID, orderNum int) error {
	err := r.q.AddScenarioToFlow(ctx, r.querier(db), gen.AddScenarioToFlowParams{
		FlowID:     flowID,
		ScenarioID: scenarioID,
		OrderNum:   int32(orderNum),
	})
	if err != nil {
		return fmt.Errorf("add scenario to flow: %w", err)
	}
	return nil
}

// RemoveScenarioFromFlow
func (r *FlowInfrastructure) RemoveScenarioFromFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID) error {
	err := r.q.RemoveScenarioFromFlow(ctx, r.querier(db), gen.RemoveScenarioFromFlowParams{
		FlowID:     flowID,
		ScenarioID: scenarioID,
	})
	if err != nil {
		return fmt.Errorf("remove scenario from flow: %w", err)
	}
	return nil
}

// GetFlowScenarios
func (r *FlowInfrastructure) GetFlowScenarios(ctx context.Context, db rdb.Querier, flowID uuid.UUID) ([]domain.FlowScenario, error) {
	rows, err := r.q.GetFlowScenarios(ctx, r.querier(db), flowID)
	if err != nil {
		return nil, err
	}
	scenarios := make([]domain.FlowScenario, len(rows))
	for i, row := range rows {
		scenarios[i] = toDomainFlowScenario(&row)
	}
	return scenarios, nil
}

// UpdateScenariosOrderInFlow
func (r *FlowInfrastructure) UpdateScenariosOrderInFlow(ctx context.Context, db rdb.Querier, flowID, scenarioID uuid.UUID, newOrder int) error {
	err := r.q.UpdateScenariosOrderInFlow(ctx, r.querier(db), gen.UpdateScenariosOrderInFlowParams{
		FlowID:     flowID,
		ScenarioID: scenarioID,
		OrderNum:   int32(newOrder),
	})
	if err != nil {
		return fmt.Errorf("update scenario order: %w", err)
	}
	return nil
}

func (s *FlowInfrastructure) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return s.db
}

func (r *FlowInfrastructure) ClearFlowScenarios(ctx context.Context, db rdb.Querier, flowID uuid.UUID) error {
	return r.q.ClearFlowScenarios(ctx, r.querier(db), flowID)
}

func (r *FlowInfrastructure) GetFlowScenariosWithDetails(ctx context.Context, db rdb.Querier, flowID uuid.UUID) ([]domain.FlowScenarioDetail, error) {
	rows, err := r.q.GetFlowScenariosWithDetails(ctx, r.querier(db), flowID)
	if err != nil {
		return nil, err
	}
	result := make([]domain.FlowScenarioDetail, len(rows))
	for i, row := range rows {
		result[i] = domain.FlowScenarioDetail{
			ScenarioID: row.ScenarioID,
			OrderNum:   int(row.OrderNum),
			Name:       row.Name,
			URL:        row.Url,
			Status:     domain.ScenarioStatus(row.Status),
		}
	}
	return result, nil
}
