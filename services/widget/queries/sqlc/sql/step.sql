-- name: GetStepsByScenario :many
SELECT id, scenario_id, order_num, selector, title, body
FROM step
WHERE scenario_id = $1
ORDER BY order_num;

-- name: GetStepByID :one
SELECT id, scenario_id, order_num, selector, title, body
FROM step
WHERE id = $1;

-- name: GetMaxOrderByScenario :one
SELECT COALESCE(MAX(order_num), 0)::int FROM step WHERE scenario_id = $1;