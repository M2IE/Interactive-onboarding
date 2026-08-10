package repositories

import (
	"context"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/M2IE/Interactive-onboarding/services/widget/internal/domain"
	chq "github.com/M2IE/Interactive-onboarding/services/widget/queries/clickhouse"
	"github.com/google/uuid"
)

type EventClickHouseRepository struct {
	conn driver.Conn
}

func NewEventClickHouseRepository(conn driver.Conn) *EventClickHouseRepository {
	return &EventClickHouseRepository{conn: conn}
}

func (r *EventClickHouseRepository) InsertEvent(ctx context.Context, event *domain.Event) error {
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
