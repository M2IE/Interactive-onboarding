package analytics

import (
	"strconv"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	chq "github.com/M2IE/Interactive-onboarding/services/admin/queries/clickhouse"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

func toDomainAnalytics(row *chq.GetScenarioAnalyticsRow) *domain.Analytics {
	if row == nil {
		return nil
	}

	return &domain.Analytics{
		TotalViews: int(row.TotalViews),
		Completed:  int(row.Completed),
		Dismissed:  int(row.Dismissed),
	}
}

func toDomainStepAnalytics(steps []gen.Step, rows []chq.GetStepAnalyticsRow) []domain.StepAnalytics {
	byStep := make(map[uuid.UUID]chq.GetStepAnalyticsRow, len(rows))
	for _, r := range rows {
		if r.StepID != nil {
			byStep[*r.StepID] = r
		}
	}

	result := make([]domain.StepAnalytics, 0, len(steps))
	for _, s := range steps {
		r := byStep[s.ID]
		result = append(result, domain.StepAnalytics{
			StepID:    s.ID,
			Title:     s.Title,
			OrderNum:  int(s.OrderNum),
			Views:     int(r.Views),
			Completed: int(r.Completed),
		})
	}

	return result
}

func ToPDFContent(a *domain.Analytics) pdfengine.Content {
	content := pdfengine.Content{Title: "Scenario Analytics Report"}

	content.Elements = append(content.Elements, pdfengine.Table{
		Title:  "Summary",
		Header: []string{"Metric", "Value"},
		Rows: [][]string{
			{"Total Views", strconv.Itoa(a.TotalViews)},
			{"Completed", strconv.Itoa(a.Completed)},
			{"Dismissed", strconv.Itoa(a.Dismissed)},
		},
	})

	if len(a.Steps) > 0 {
		content.Elements = append(content.Elements, pdfengine.Paragraph{
			Text: "Detailed breakdown of each step:",
		})
		content.Elements = append(content.Elements, pdfengine.Table{
			Title:  "Steps",
			Header: []string{"#", "Step", "Views", "Completed"},
			Rows:   stepsToRows(a.Steps),
		})
	}

	return content
}

func stepsToRows(steps []domain.StepAnalytics) [][]string {
	rows := make([][]string, len(steps))
	for i, s := range steps {
		rows[i] = []string{
			strconv.Itoa(s.OrderNum),
			s.Title,
			strconv.Itoa(s.Views),
			strconv.Itoa(s.Completed),
		}
	}
	return rows
}
