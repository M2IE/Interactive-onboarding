-- name: GetProjectByKey :one
SELECT id, name, project_key, created_at
FROM project
WHERE project_key = $1;