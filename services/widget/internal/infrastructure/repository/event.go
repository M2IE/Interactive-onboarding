package repositories

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	"github.com/M2IE/Interactive-onboarding/services/widget/queries"
	chq "github.com/M2IE/Interactive-onboarding/services/widget/queries/clickhouse"
	"github.com/google/uuid"
)

type EventRepository struct {
	q    *queries.Query
	conn olap.Database
}

func NewEventRepository(conn olap.Database, q *queries.Query) *EventRepository {
	return &EventRepository{q: q, conn: conn}
}

func (r *EventRepository) InsertEvent(ctx context.Context, _ rdb.Querier, event *domain.Event) error {
	var scenarioID uuid.UUID
	if event.ScenarioID != nil {
		scenarioID = *event.ScenarioID
	}

	return r.q.InsertEvent(ctx, r.conn, chq.InsertEventParams{
		ID:         event.ID,
		ProjectID:  event.ProjectID,
		ScenarioID: scenarioID,
		StepID:     event.StepID,
		SessionID:  event.SessionID,
		Type:       string(event.Type),
		EventKey:   event.EventKey,
	})
}

func (r *EventRepository) ExistsEventByKey(ctx context.Context, _ rdb.Querier, eventKey string) (bool, error) {
	return r.q.ExistsEventByKey(ctx, r.conn, eventKey)
}

func (r *EventRepository) ExistsScenarioCompleted(ctx context.Context, _ rdb.Querier, sessionID string, scenarioID *uuid.UUID) (bool, error) {
	var scID uuid.UUID
	if scenarioID != nil {
		scID = *scenarioID
	}

	return r.q.ExistsScenarioCompleted(ctx, r.conn, sessionID, scID)
}
