package analytics

import (
	"fmt"
	"strconv"
	"time"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine/elements"
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

func ToPDFContent(a *domain.Analytics) elements.Content {
	var funnel, steps [][]string
	if len(a.Steps) > 0 {
		funnel = funnelRows(a)
		steps = stepAnalysisRows(a.Steps)
	}

	return elements.Content{
		Data: elements.ReportData{
			Title:          "Scenario Analytics Report",
			Subtitle:       a.Name,
			Date:           time.Now().Format("2 January 2006"),
			Metrics:        metrics(a),
			CompletionRate: percent(a.Completed, a.TotalViews),
			FunnelRows:     funnel,
			StepRows:       steps,
			Findings:       findings(a),
		},
	}
}

func metrics(a *domain.Analytics) []elements.Metric {
	total := a.TotalViews
	notFinished := total - a.Completed - a.Dismissed
	return []elements.Metric{
		{Label: "В процессе", Value: notFinished, Share: percent(notFinished, total)},
		{Label: "Завершено", Value: a.Completed, Share: percent(a.Completed, total)},
		{Label: "Прервано", Value: a.Dismissed, Share: percent(a.Dismissed, total)},
	}
}

func findings(a *domain.Analytics) []string {
	find := make([]string, 0, 3)
	if step, ok := largestDropOffStep(a.Steps); ok {
		find = append(find, fmt.Sprintf("Наибольший отток: Step %d", step))
	}
	find = append(find,
		fmt.Sprintf("Процент завершений: %s", percent(a.Completed, a.TotalViews)),
		fmt.Sprintf("Пользователи прервали сценарий: %v", a.Dismissed),
	)
	return find
}

func funnelRows(a *domain.Analytics) [][]string {
	rows := make([][]string, 0, len(a.Steps)+1)
	for i, s := range a.Steps {
		drop := ""
		if i > 0 {
			drop = dropOff(a.Steps[i-1].Views, s.Views)
		}
		rows = append(rows, []string{
			fmt.Sprintf("Step %d", s.OrderNum),
			strconv.Itoa(s.Views),
			drop,
		})
	}

	rows = append(rows, []string{
		"Завершено",
		strconv.Itoa(a.Completed),
		dropOff(a.Steps[len(a.Steps)-1].Views, a.Completed),
	})

	return rows
}

func stepAnalysisRows(steps []domain.StepAnalytics) [][]string {
	rows := make([][]string, len(steps))
	for i, s := range steps {
		rows[i] = []string{
			fmt.Sprintf("Step %d", s.OrderNum),
			strconv.Itoa(s.Views),
			strconv.Itoa(s.Completed),
			percent(s.Completed, s.Views),
		}
	}
	return rows
}

func largestDropOffStep(steps []domain.StepAnalytics) (int, bool) {
	maxDrop := 0
	orderNum := 0
	for i := 1; i < len(steps); i++ {
		drop := steps[i-1].Views - steps[i].Views
		if drop >= maxDrop {
			maxDrop = drop
			orderNum = steps[i].OrderNum
		}
	}
	return orderNum, maxDrop > 0
}

func percent(part, total int) string {
	if total <= 0 {
		return "0.0%"
	}
	return fmt.Sprintf("%.1f%%", float64(part)/float64(total)*100)
}

func dropOff(prev, cur int) string {
	if prev <= 0 {
		return ""
	}

	diff := float64(prev-cur) / float64(prev) * 100
	if diff < 0 {
		return fmt.Sprintf("↑ %.1f%%", -diff)
	}
	return fmt.Sprintf("↓ %.1f%%", diff)
}
