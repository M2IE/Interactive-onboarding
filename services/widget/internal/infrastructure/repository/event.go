package repositories

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/M2IE/Interactive-onboarding/pkg/database/rdb"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	chq "github.com/M2IE/Interactive-onboarding/services/widget/queries/clickhouse"
	"github.com/google/uuid"
)

type EventClickHouseRepository struct {
	conn olap.Database
}

func NewEventClickHouseRepository(conn olap.Database) *EventClickHouseRepository {
	return &EventClickHouseRepository{conn: conn}
}

func (r *EventClickHouseRepository) InsertEvent(ctx context.Context, _ rdb.Querier, event *domain.Event) error {
	var scenarioID uuid.UUID
	if event.ScenarioID != nil {
		scenarioID = *event.ScenarioID
	}

	batch, err := r.conn.PrepareBatch(ctx, chq.InsertEvent)
	if err != nil {
		return err
	}

	if err := batch.Append(
		event.ID,
		event.ProjectID,
		scenarioID,
		event.StepID,
		event.SessionID,
		string(event.Type),
		event.EventKey,
	); err != nil {
		return err
	}

	return batch.Send()
}

func (r *EventClickHouseRepository) ExistsEventByKey(ctx context.Context, _ rdb.Querier, eventKey string) (bool, error) {
	var count uint64
	if err := r.conn.QueryRow(ctx, chq.ExistsEventByKey, eventKey).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *EventClickHouseRepository) ExistsScenarioCompleted(ctx context.Context, _ rdb.Querier, sessionID string, scenarioID *uuid.UUID) (bool, error) {
	var scID uuid.UUID
	if scenarioID != nil {
		scID = *scenarioID
	}

	var count uint64
	if err := r.conn.QueryRow(ctx, chq.ExistsScenarioCompleted, sessionID, scID).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}
