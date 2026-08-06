package analytics

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
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
	s3        s3.Client
	pdf       pdfengine.Engine
	bucket    string
}

func NewAnalyticsService(infra IAnalyticsInfrastructure, txManager database.Database, s3Client s3.Client, pdfEngine pdfengine.Engine, bucket string) *AnalyticsService {
	return &AnalyticsService{
		infra:     infra,
		txManager: txManager,
		s3:        s3Client,
		pdf:       pdfEngine,
		bucket:    bucket,
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

	content := analytics.ToPDFContent()
	pdfBytes, err := s.pdf.GeneratePDF(ctx, content)
	if err != nil {
		return "", fmt.Errorf("generate pdf: %w", err)
	}

	key := fmt.Sprintf("%s_%s.pdf", scenarioID.String(), time.Now())
	url, err := s.s3.Upload(ctx, s.bucket, key, bytes.NewReader(pdfBytes), "application/pdf")
	if err != nil {
		slog.Error("failed to upload report to s3", "error", err)
		return "", fmt.Errorf("upload report: %w", err)
	}

	return url, nil
}
