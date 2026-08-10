package analytics

import (
	"strconv"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

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
