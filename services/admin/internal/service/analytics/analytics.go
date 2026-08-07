package analytics

import (
	"context"
	"fmt"
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

	// S3
	UploadAnalytics(ctx context.Context, scenarioID uuid.UUID, analytics *domain.Analytics) (string, error)
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

	key := fmt.Sprintf("%s_%s.pdf", scenarioID.String(), time.Now())
	url, err := s.s3.Upload(ctx, s.bucket, key, bytes.NewReader(pdfBytes), "application/pdf")
	if err != nil {
		slog.Error("failed to upload report to s3", "error", err)
		return "", fmt.Errorf("upload report: %w", err)
	}

	return url, nil
}
