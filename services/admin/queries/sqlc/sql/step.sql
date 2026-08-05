-- name: CopyStepsToScenario :exec
INSERT INTO step (scenario_id, order_num, selector, title, body)
SELECT sqlc.arg(dest_scenario_id)::uuid, order_num, selector, title, body
FROM step WHERE scenario_id = sqlc.arg(src_scenario_id)::uuid;
