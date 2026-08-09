package analytics

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
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
	ch             driver.Conn
	s3             s3.Client
	pdf            pdfengine.Engine
	s3ReportBucket string
}

func NewAnalyticsInfrastructure(db database.Querier, q *queries.Query, ch driver.Conn, s3 s3.Client, pdf pdfengine.Engine, s3ReportBucket string) *AnalyticsInfrastructure {
	return &AnalyticsInfrastructure{
		q:              q,
		db:             db,
		ch:             ch,
		s3:             s3,
		pdf:            pdf,
		s3ReportBucket: s3ReportBucket,
	}
}

func (a *AnalyticsInfrastructure) GetScenarioAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (*domain.Analytics, error) {
	steps, err := a.q.GetStepsByScenario(ctx, a.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}

	var firstStepID uuid.UUID
	for _, s := range steps {
		if s.OrderNum == 1 {
			firstStepID = s.ID
			break
		}
	}

	var totalViews, completed, dismissed uint64
	err = a.ch.QueryRow(ctx,
		`SELECT
			countIf(type = 'step_viewed' AND step_id = ?),
			countIf(type = 'scenario_completed'),
			countIf(type = 'scenario_dismissed')
		FROM analytics.events
		WHERE scenario_id = ?`,
		firstStepID, scenarioID,
	).Scan(&totalViews, &completed, &dismissed)
	if err != nil {
		return nil, err
	}

	return &domain.Analytics{
		TotalViews: int(totalViews),
		Completed:  int(completed),
		Dismissed:  int(dismissed),
	}, nil
}

func (a *AnalyticsInfrastructure) ScenarioExists(ctx context.Context, db database.Querier, scenarioID uuid.UUID) (bool, error) {
	return a.q.ScenarioExists(ctx, a.querier(db), scenarioID)
}

func (a *AnalyticsInfrastructure) GetStepAnalytics(ctx context.Context, db database.Querier, scenarioID uuid.UUID) ([]domain.StepAnalytics, error) {
	steps, err := a.q.GetStepsByScenario(ctx, a.querier(db), scenarioID)
	if err != nil {
		return nil, err
	}

	type counts struct{ views, completed uint64 }
	byStep := make(map[uuid.UUID]counts)

	rows, err := a.ch.Query(ctx,
		`SELECT step_id, countIf(type = 'step_viewed'), countIf(type = 'step_completed')
		FROM analytics.events
		WHERE scenario_id = ? AND step_id IS NOT NULL
		GROUP BY step_id`,
		scenarioID,
	)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	for rows.Next() {
		var stepID *uuid.UUID
		var views, completed uint64
		if err := rows.Scan(&stepID, &views, &completed); err != nil {
			return nil, err
		}
		if stepID != nil {
			byStep[*stepID] = counts{views: views, completed: completed}
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := make([]domain.StepAnalytics, 0, len(steps))
	for _, s := range steps {
		c := byStep[s.ID]
		result = append(result, domain.StepAnalytics{
			StepID:    s.ID,
			Title:     s.Title,
			OrderNum:  int(s.OrderNum),
			Views:     int(c.views),
			Completed: int(c.completed),
		})
	}
	return result, nil
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
