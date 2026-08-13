package clickhouse

import (
	"context"

	"github.com/M2IE/Interactive-onboarding/pkg/database/olap"
	"github.com/google/uuid"
)

const getScenarioAnalytics = `SELECT
	countIf(type = 'step_viewed' AND step_id = ?),
	countIf(type = 'scenario_completed'),
	countIf(type = 'scenario_dismissed')
FROM analytics.events
WHERE scenario_id = ?`

type GetScenarioAnalyticsParams struct {
	FirstStepID uuid.UUID `db:"first_step_id"`
	ScenarioID  uuid.UUID `db:"scenario_id"`
}

type GetScenarioAnalyticsRow struct {
	TotalViews uint64 `db:"total_views"`
	Completed  uint64 `db:"completed"`
	Dismissed  uint64 `db:"dismissed"`
}

func (q *CHQueries) GetScenarioAnalytics(ctx context.Context, conn olap.Database, arg GetScenarioAnalyticsParams) (GetScenarioAnalyticsRow, error) {
	row := conn.QueryRow(ctx, getScenarioAnalytics, arg.FirstStepID, arg.ScenarioID)
	var i GetScenarioAnalyticsRow
	err := row.Scan(
		&i.TotalViews,
		&i.Completed,
		&i.Dismissed,
	)
	return i, err
}

const getStepAnalytics = `SELECT step_id, countIf(type = 'step_viewed'), countIf(type = 'step_completed')
FROM analytics.events
WHERE scenario_id = ? AND step_id IS NOT NULL
GROUP BY step_id`

type GetStepAnalyticsRow struct {
	StepID    *uuid.UUID `db:"step_id"`
	Views     uint64     `db:"views"`
	Completed uint64     `db:"completed"`
}

func (q *CHQueries) GetStepAnalytics(ctx context.Context, conn olap.Database, scenarioID uuid.UUID) ([]GetStepAnalyticsRow, error) {
	rows, err := conn.Query(ctx, getStepAnalytics, scenarioID)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()
	var items []GetStepAnalyticsRow
	for rows.Next() {
		var i GetStepAnalyticsRow
		if err := rows.Scan(
			&i.StepID,
			&i.Views,
			&i.Completed,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const insertEvent = `INSERT INTO analytics.events (id, project_id, scenario_id, step_id, session_id, type, event_key)`

type InsertEventParams struct {
	ID         uuid.UUID  `db:"id"`
	ProjectID  uuid.UUID  `db:"project_id"`
	ScenarioID uuid.UUID  `db:"scenario_id"`
	StepID     *uuid.UUID `db:"step_id"`
	SessionID  string     `db:"session_id"`
	Type       string     `db:"type"`
	EventKey   string     `db:"event_key"`
}

func (q *CHQueries) InsertEvent(ctx context.Context, conn olap.Database, arg InsertEventParams) error {
	batch, err := conn.PrepareBatch(ctx, insertEvent)
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
