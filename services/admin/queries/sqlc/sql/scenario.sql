-- name: GetScenario :one
SELECT * FROM scenario WHERE id = $1 FOR UPDATE;

-- name: ScenarioExists :one
SELECT EXISTS(SELECT 1 FROM scenario WHERE id = $1) AS exists;

-- name: CreateScenario :one
INSERT INTO scenario (project_id, name, url, status)
VALUES ($1, $2, $3, $4)
RETURNING id, project_id, name, url, status, created_at, updated_at;

-- name: UpdateScenarioStatusById :exec
UPDATE scenario SET status = $2, updated_at = now() WHERE id = $1;

-- name: ArchiveByProjectAndStatus :execrows
UPDATE scenario SET status = 'archived', updated_at = now()
WHERE project_id = $1 AND status = $2 AND url = $3;

-- name: GetScenarioStatus :one
SELECT status FROM scenario WHERE id = $1;