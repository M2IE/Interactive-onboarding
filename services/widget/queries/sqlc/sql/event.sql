-- name: InsertEvent :exec
INSERT INTO event (id, project_id, scenario_id, step_id, session_id, type, event_key, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (event_key) DO NOTHING;