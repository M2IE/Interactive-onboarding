-- name: GetProjectByKey :one
SELECT * FROM project WHERE project_key = $1;
