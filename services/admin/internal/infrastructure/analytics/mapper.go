package analytics

import (
	"strconv"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/admin/queries/sqlc/gen"
	"github.com/google/uuid"
)

// ENTITY = Domain / DB

func toScenarioAnalytics(row *gen.GetAnalyticsRow) *domain.Analytics {
	return &domain.Analytics{
		TotalViews: int(row.TotalViews),
		Completed:  int(row.Completed),
		Dismissed:  int(row.Dismissed),
	}
}

func toStepAnalyticsList(rows []gen.GetStepAnalyticsRow) []domain.StepAnalytics {
	steps := make([]domain.StepAnalytics, len(rows))
	for i, s := range rows {
		steps[i] = domain.StepAnalytics{
			StepID:    s.StepID,
			Title:     s.Title,
			OrderNum:  int(s.OrderNum),
			Views:     int(s.Views),
			Completed: int(s.Completed),
		}
	}
	return steps
}

func toNullUUID(id uuid.UUID) uuid.NullUUID {
	return uuid.NullUUID{UUID: id, Valid: true}
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
