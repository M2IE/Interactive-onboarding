-- name: GetScenario :one
SELECT * FROM scenario WHERE id = $1 FOR UPDATE;

-- name: CreateScenario :one
INSERT INTO scenario (project_id, name, url, status)
VALUES ($1, $2, $3, $4)
RETURNING id, project_id, name, url, status, created_at, updated_at;

-- name: UpdateScenarioStatusById :exec
UPDATE scenario SET status = $2, updated_at = now() WHERE id = $1;

-- name: ArchiveByProjectAndStatus :execrows
UPDATE scenario SET status = 'archived', updated_at = now()
WHERE project_id = $1 AND status = $2 AND url = $3;

-- name: ListScenarios :many
SELECT *, count(*) OVER() AS total_count
FROM scenario
WHERE (sqlc.narg('project_id')::uuid IS NULL OR project_id = sqlc.narg('project_id'))
ORDER BY created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: UpdateScenario :one
UPDATE scenario SET
    name = COALESCE(sqlc.narg('name')::text, name),
    url = COALESCE(sqlc.narg('url')::text, url),
    updated_at = now()
WHERE id = sqlc.arg('id') AND status = 'draft'
RETURNING id, project_id, name, url, status, created_at, updated_at;

-- name: GetScenarioStatus :one
SELECT status FROM scenario WHERE id = $1;
