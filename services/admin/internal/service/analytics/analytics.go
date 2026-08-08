package analytics

import (
	"context"
	"io"
	"log/slog"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/google/uuid"
)

type IAnalyticsInfrastructure interface {
	// DB
	GetScenarioAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (*domain.Analytics, error)
	GetStepAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.StepAnalytics, error)
	ScenarioExists(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (bool, error)

	// S3
	UploadAnalytics(ctx context.Context, scenarioID uuid.UUID, analytics *domain.Analytics) (string, error)
	DownloadAnalytics(ctx context.Context, filename string) (io.ReadCloser, error)
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
				slog.Error("failed to rollback GetAnalitics transaction", "error", rbErr)
			}
		}
	}()

	exists, err := s.infra.ScenarioExists(ctx, tx, scenarioID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrScenarioNotFound
	}

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

func (s *AnalyticsService) GenerateReport(ctx context.Context, scenarioID uuid.UUID) (string, error) {
	analytics, err := s.GetAnalytics(ctx, scenarioID)
	if err != nil {
		return "", err
	}

	// return filename and error
	return s.infra.UploadAnalytics(ctx, scenarioID, analytics)
}

func (s *AnalyticsService) DownloadReport(ctx context.Context, filename string) (io.ReadCloser, error) {
	return s.infra.DownloadAnalytics(ctx, filename)
}
