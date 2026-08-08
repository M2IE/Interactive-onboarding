package analytics

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
)

type AnalyticsInfrastructure struct {
	q              *queries.Query
	db             database.Querier
	s3             s3.Client
	pdf            pdfengine.Engine
	s3ReportBucket string
}

func NewAnalyticsInfrastructure(db database.Querier, q *queries.Query, s3 s3.Client, pdf pdfengine.Engine, s3ReportBucket string) *AnalyticsInfrastructure {
	return &AnalyticsInfrastructure{
		q:              q,
		db:             db,
		s3:             s3,
		pdf:            pdf,
		s3ReportBucket: s3ReportBucket,
	}
}

func (a *AnalyticsInfrastructure) GetScenarioAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (*domain.Analytics, error) {
	row, err := a.q.GetAnalytics(ctx, a.querier(db), toNullUUID(scenarioID))
	if err != nil {
		return nil, err
	}
	return toScenarioAnalytics(&row), nil
}

func (a *AnalyticsInfrastructure) ScenarioExists(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (bool, error) {
	return a.q.ScenarioExists(ctx, a.querier(db), scenarioID)
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

func (a *AnalyticsInfrastructure) UploadAnalytics(ctx context.Context, scenarioID uuid.UUID, analytics *domain.Analytics) (string, error) {
	pdfBytes, err := a.pdf.GeneratePDF(ctx, ToPDFContent(analytics))
	if err != nil {
		return "", fmt.Errorf("Error in PDF generateion: %w", err)
	}

	key := fmt.Sprintf("%s_%s.pdf", scenarioID.String(), time.Now().Format("20060102150405"))
	if err := a.s3.Upload(ctx, a.s3ReportBucket, key, bytes.NewReader(pdfBytes), "application/pdf"); err != nil {
		slog.Error("failed to upload report to s3", "error", err)
		return "", fmt.Errorf("upload report: %w", err)
	}

	return key, nil
}

func (a *AnalyticsInfrastructure) DownloadAnalytics(ctx context.Context, filename string) (io.ReadCloser, error) {
	r, err := a.s3.Download(ctx, a.s3ReportBucket, filename)
	if err != nil {
		if _, ok := errors.AsType[*types.NoSuchKey](err); ok {
			return nil, domain.ErrReportNotFound
		}
		return nil, err
	}
	return r, nil
}
