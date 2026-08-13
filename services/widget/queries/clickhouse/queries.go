package clickhouse

import (
	"context"

	"github.com/google/uuid"
)

type InsertEventParams struct {
	ID         uuid.UUID
	ProjectID  uuid.UUID
	ScenarioID uuid.UUID
	StepID     *uuid.UUID
	SessionID  string
	Type       string
	EventKey   string
}

func (q *CHQueries) InsertEvent(ctx context.Context, conn CHConn, arg InsertEventParams) error {
	batch, err := conn.PrepareBatch(ctx, `INSERT INTO analytics.events (id, project_id, scenario_id, step_id, session_id, type, event_key)`)
	if err != nil {
		return err
	}

	if err := batch.Append(
		arg.ID,
		arg.ProjectID,
		arg.ScenarioID,
		arg.StepID,
		arg.SessionID,
		arg.Type,
		arg.EventKey,
	); err != nil {
		return err
	}

	return batch.Send()
}

func (q *CHQueries) ExistsEventByKey(ctx context.Context, conn CHConn, eventKey string) (bool, error) {
	var count uint64
	if err := conn.QueryRow(ctx, `SELECT count() FROM analytics.events WHERE event_key = ?`, eventKey).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}

func (q *CHQueries) ExistsScenarioCompleted(ctx context.Context, conn CHConn, sessionID string, scenarioID uuid.UUID) (bool, error) {
	var count uint64
	if err := conn.QueryRow(ctx, `SELECT count() FROM analytics.events WHERE session_id = ? AND scenario_id = ? AND type = 'scenario_completed'`, sessionID, scenarioID).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}
