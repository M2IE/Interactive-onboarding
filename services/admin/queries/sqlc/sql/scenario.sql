-- name: GetScenario :one
SELECT s.id, s.project_id, s.name, s.url, s.status, s.created_at, s.updated_at,
       COALESCE(sv.id, s.id)::uuid AS version_id,
       COALESCE(sv.version, 0)::int AS version,
       COALESCE(sv.is_active, false)::bool AS is_active
FROM scenario s
LEFT JOIN scenario_version sv ON sv.scenario_id = s.id AND sv.is_active = true
WHERE s.id = $1
FOR UPDATE OF s;

-- name: UpdateScenarioStatus :exec
UPDATE scenario SET status = $2, updated_at = now() WHERE id = $1;
