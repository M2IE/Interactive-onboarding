-- name: GetFlowByKey :one
SELECT id, project_id, name, description, flow_key, created_at
FROM flows
WHERE project_id = $1 AND flow_key = $2;

-- name: GetFlowByScenarioID :one
SELECT f.id, f.project_id, f.name, f.description, f.flow_key, f.created_at
FROM flows f
JOIN flow_scenario fs ON fs.flow_id = f.id
WHERE fs.scenario_id = $1
LIMIT 1;

-- name: GetFlowScenariosWithDetails :many
SELECT fs.scenario_id, fs.order_num, s.name, s.url, s.status
FROM flow_scenario fs
JOIN scenario s ON s.id = fs.scenario_id
WHERE fs.flow_id = $1
ORDER BY fs.order_num;