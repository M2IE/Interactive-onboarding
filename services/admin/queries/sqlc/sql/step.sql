-- name: CopyStepsToScenario :exec
INSERT INTO step (scenario_id, order_num, selector, title, body)
SELECT sqlc.arg(dest_scenario_id)::uuid, order_num, selector, title, body
FROM step WHERE scenario_id = sqlc.arg(src_scenario_id)::uuid;

-- name: DecrementOrdersAfter :exec
UPDATE step
SET order_num = order_num - 1
WHERE scenario_id = $1 AND order_num > $2;

-- name: GetStepByID :one
SELECT * FROM step WHERE id = $1;

-- name: GetStepsByScenario :many
SELECT * FROM step WHERE scenario_id = $1 ORDER BY order_num;

-- name: CreateStep :one
INSERT INTO step (id, scenario_id, order_num, selector, title, body)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateStep :exec
UPDATE step
SET selector = $1, title = $2, body = $3
WHERE id = $4;

-- name: DeleteStep :exec
DELETE FROM step WHERE id = $1;

-- name: GetMaxOrderByScenario :one
SELECT COALESCE(MAX(order_num), 0) FROM step WHERE scenario_id = $1;

-- name: UpdateStepOrder :exec
UPDATE step SET order_num = $1 WHERE id = $2;