package repositories

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries/sqlc/gen"
	"github.com/google/uuid"
)

type EventRepository struct {
	q  *queries.Query
	db database.Querier
}

func NewEventRepository(db database.Querier, q *queries.Query) *EventRepository {
	return &EventRepository{q: q, db: db}
}

func (r *EventRepository) InsertEvent(ctx context.Context, db database.Querier, event *domain.Event) error {
	var scenarioID, stepID uuid.NullUUID
	if event.ScenarioID != nil {
		scenarioID = uuid.NullUUID{UUID: *event.ScenarioID, Valid: true}
	}
	if event.StepID != nil {
		stepID = uuid.NullUUID{UUID: *event.StepID, Valid: true}
	}

	params := gen.InsertEventParams{
		ID:         event.ID,
		ProjectID:  event.ProjectID,
		ScenarioID: scenarioID,
		StepID:     stepID,
		SessionID:  event.SessionID,
		Type:       gen.EventType(event.Type),
		EventKey:   event.EventKey,
	}
	return r.q.InsertEvent(ctx, r.querier(db), params)
}

func (r *EventRepository) ExistsScenarioCompleted(ctx context.Context, db database.Querier, sessionID string, scenarioID *uuid.UUID) (bool, error) {
	var scenarioIDNull uuid.NullUUID
	if scenarioID != nil {
		scenarioIDNull = uuid.NullUUID{UUID: *scenarioID, Valid: true}
	}

	return r.q.ExistsScenarioCompleted(ctx, r.querier(db), gen.ExistsScenarioCompletedParams{
		SessionID:  sessionID,
		ScenarioID: scenarioIDNull,
	})
}

func (r *EventRepository) ExistsEventByKey(ctx context.Context, db database.Querier, eventKey string) (bool, error) {
	return r.q.ExistsEventByKey(ctx, r.querier(db), eventKey)
}

func (s *EventRepository) querier(db database.Querier) database.Querier {
	if db != nil {
		return db
	}
	return s.db
}
