package domain

import (
	"strconv"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine"
	"github.com/google/uuid"
)

type Analytics struct {
	TotalViews int
	Completed  int
	Dismissed  int
	Steps      []StepAnalytics
}

type StepAnalytics struct {
	StepID    uuid.UUID
	Title     string
	OrderNum  int
	Views     int
	Completed int
}

func (a *Analytics) ToPDFContent() pdfengine.Content {
	content := pdfengine.Content{Title: "Scenario Analytics Report"}

	content.Elements = append(content.Elements, pdfengine.Table{
		Title:  "Summary",
		Header: []string{"Metric", "Value"},
		Rows: [][]string{
			{strconv.Itoa(a.TotalViews), "Total Views"},
			{strconv.Itoa(a.Completed), "Completed"},
			{strconv.Itoa(a.Dismissed), "Dismissed"},
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

func stepsToRows(steps []StepAnalytics) [][]string {
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
