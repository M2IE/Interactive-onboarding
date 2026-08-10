package clickhouse

const InsertEvent = `INSERT INTO analytics.events (id, project_id, scenario_id, step_id, session_id, type, event_key)`

const ExistsEventByKey = `SELECT count() FROM analytics.events WHERE event_key = ?`

const ExistsScenarioCompleted = `SELECT count() FROM analytics.events WHERE session_id = ? AND scenario_id = ? AND type = 'scenario_completed'`
