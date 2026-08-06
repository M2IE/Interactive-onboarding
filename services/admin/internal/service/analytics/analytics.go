package analytics

import (
	"context"
	"log/slog"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IAnalyticsInfrastructure interface {
	GetScenarioAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (*domain.Analytics, error)
	GetStepAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.StepAnalytics, error)
}

type AnalyticsService struct {
	infra     IAnalyticsInfrastructure
	txManager database.Database
}

func NewAnalyticsService(infra IAnalyticsInfrastructure, txManager database.Database) *AnalyticsService {
	return &AnalyticsService{
		infra:     infra,
		txManager: txManager,
	}
}

func (s *AnalyticsService) GetAnalytics(ctx context.Context, scenarioID uuid.UUID) (*domain.Analytics, error) {
	tx, err := s.txManager.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				slog.Error("failed to rollback unpublish transaction", "error", rbErr)
			}
		}
	}()

	result, err := s.infra.GetScenarioAnalytics(ctx, tx, scenarioID)
	if err != nil {
		return nil, err
	}

	result.Steps, err = s.infra.GetStepAnalytics(ctx, tx, scenarioID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return result, nil
}
