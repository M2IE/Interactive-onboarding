-- name: InsertEvent :exec
INSERT INTO event (id, project_id, scenario_id, step_id, session_id, type, event_key, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (event_key) DO NOTHING;

-- name: ExistsScenarioCompleted :one
SELECT EXISTS(SELECT 1 FROM event WHERE session_id = $1 AND scenario_id = $2 AND type = 'scenario_completed');

-- name: ExistsEventByKey :one
SELECT EXISTS(SELECT 1 FROM event WHERE event_key = $1);