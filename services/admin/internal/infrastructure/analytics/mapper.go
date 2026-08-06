package analytics

import (
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
