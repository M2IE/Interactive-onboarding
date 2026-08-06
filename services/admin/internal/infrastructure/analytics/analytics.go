package analytics

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/google/uuid"
)

type AnalyticsInfrastructure struct {
	q  *queries.Query
	db database.Querier
}

func NewAnalyticsInfrastructure(db database.Querier, q *queries.Query) *AnalyticsInfrastructure {
	return &AnalyticsInfrastructure{
		q:  q,
		db: db,
	}
}

func (a *AnalyticsInfrastructure) GetScenarioAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (*domain.Analytics, error) {
	row, err := a.q.GetAnalytics(ctx, a.querier(db), toNullUUID(scenarioID))
	if err != nil {
		return nil, err
	}
	return toScenarioAnalytics(&row), nil
}

func (a *AnalyticsInfrastructure) GetStepAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.StepAnalytics, error) {
	rows, err := a.q.GetStepAnalytics(ctx, a.querier(db), toNullUUID(scenarioID))
	if err != nil {
		return nil, err
	}
	return toStepAnalyticsList(rows), nil
}

func (a *AnalyticsInfrastructure) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}
	return a.db
}
