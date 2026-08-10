package clickhouse

const (
	GetScenarioAnalytics = `SELECT
	countIf(type = 'step_viewed' AND step_id = ?),
	countIf(type = 'scenario_completed'),
	countIf(type = 'scenario_dismissed')
FROM analytics.events
WHERE scenario_id = ?`

	GetStepAnalytics = `SELECT step_id, countIf(type = 'step_viewed'), countIf(type = 'step_completed')
FROM analytics.events
WHERE scenario_id = ? AND step_id IS NOT NULL
GROUP BY step_id`

	InsertEvent = `INSERT INTO analytics.events (id, project_id, scenario_id, step_id, session_id, type, event_key)`
)
