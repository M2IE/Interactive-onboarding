-- name: GetPublishedScenarioByURL :one
SELECT id, project_id, name, url, status, created_at, updated_at
FROM scenario
WHERE project_id = $1
  AND url = $2
  AND status = 'published'
LIMIT 1;

-- name: GetScenarioByID :one
SELECT id, project_id, name, url, status, created_at, updated_at
FROM scenario
WHERE id = $1;