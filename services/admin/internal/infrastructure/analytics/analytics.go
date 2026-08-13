package analytics

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/pkg/s3"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries"
	chq "github.com/M2IE/Interactive-onboarding/services/admin/queries/clickhouse"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
)

type AnalyticsInfrastructure struct {
	q              *queries.Query
	db             rdb.Querier
	ch             olap.Database
	s3             s3.Client
	pdf            pdfengine.Engine
	s3ReportBucket string
}

func NewAnalyticsInfrastructure(db rdb.Querier, q *queries.Query, ch olap.Database, s3 s3.Client, pdf pdfengine.Engine, s3ReportBucket string) *AnalyticsInfrastructure {
	return &AnalyticsInfrastructure{
		q:              q,
		db:             db,
		ch:             ch,
		s3:             s3,
		pdf:            pdf,
		s3ReportBucket: s3ReportBucket,
	}
}

func (a *AnalyticsInfrastructure) GetScenarioAnalytics(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (*domain.Analytics, error) {
	firstStepID, err := a.q.GetFirstStepID(ctx, a.querier(db), scenarioID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	result, err := a.q.GetScenarioAnalytics(ctx, a.ch, chq.GetScenarioAnalyticsParams{
		FirstStepID: firstStepID,
		ScenarioID:  scenarioID,
	})
	if err != nil {
		return nil, err
	}

	return toDomainAnalytics(&result), nil
}

func (a *AnalyticsInfrastructure) ScenarioExists(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) (bool, error) {
	return a.q.ScenarioExists(ctx, a.querier(db), scenarioID)
}

func (a *AnalyticsInfrastructure) GetStepAnalytics(ctx context.Context, db rdb.Querier, scenarioID uuid.UUID) ([]domain.StepAnalytics, error) {
	steps, err := a.q.GetStepsByScenario(ctx, a.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}

	rows, err := a.q.GetStepAnalytics(ctx, a.ch, scenarioID)
	if err != nil {
		return nil, err
	}

	return toDomainStepAnalytics(steps, rows), nil
}

func (a *AnalyticsInfrastructure) querier(db rdb.Querier) rdb.Querier {
	if db != nil {
		return db
	}
	return a.db
}

func (a *AnalyticsInfrastructure) UploadAnalytics(ctx context.Context, scenarioID uuid.UUID, analytics *domain.Analytics) (string, error) {
	pdfBytes, err := a.pdf.GeneratePDF(ctx, ToPDFContent(analytics))
	if err != nil {
		return "", fmt.Errorf("error in PDF generation: %w", err)
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
