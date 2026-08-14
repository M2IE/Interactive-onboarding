-- name: CreateFlow :one
INSERT INTO flows (id, project_id, name, description, flow_key)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, project_id, name, description, flow_key, created_at;

-- name: GetFlowByID :one
SELECT id, project_id, name, description, flow_key, created_at
FROM flows
WHERE id = $1;

-- name: GetFlowsByProject :many
SELECT id, project_id, name, description, flow_key, created_at
FROM flows
WHERE project_id = $1
ORDER BY created_at DESC;

-- name: GetFlowByKey :one
SELECT id, project_id, name, description, flow_key, created_at
FROM flows
WHERE project_id = $1 AND flow_key = $2;

-- name: GetFlowByScenarioID :one
SELECT f.id, f.project_id, f.name, f.description, f.flow_key, f.created_at
FROM flows f
JOIN flow_scenario fs ON fs.flow_id = f.id
WHERE fs.scenario_id = $1;

-- name: GetFlowScenarioMembership :one
SELECT flow_id, scenario_id, order_num
FROM flow_scenario
WHERE scenario_id = $1;

-- name: UpdateFlow :exec
UPDATE flows
SET name = $1, description = $2
WHERE id = $3;

-- name: DeleteFlow :exec
DELETE FROM flows WHERE id = $1;

-- name: AddScenarioToFlow :exec
INSERT INTO flow_scenario (flow_id, scenario_id, order_num)
VALUES ($1, $2, $3)
ON CONFLICT (flow_id, scenario_id) DO NOTHING;

-- name: RemoveScenarioFromFlow :exec
DELETE FROM flow_scenario
WHERE flow_id = $1 AND scenario_id = $2;

-- name: GetFlowScenarios :many
SELECT fs.flow_id, fs.scenario_id, fs.order_num,
       s.id, s.project_id, s.name, s.url, s.status, s.created_at, s.updated_at
FROM flow_scenario fs
JOIN scenario s ON s.id = fs.scenario_id
WHERE fs.flow_id = $1
ORDER BY fs.order_num;

-- name: UpdateScenariosOrderInFlow :exec
UPDATE flow_scenario
SET order_num = $1
WHERE flow_id = $2 AND scenario_id = $3;

-- name: ClearFlowScenarios :exec
DELETE FROM flow_scenario WHERE flow_id = $1;

-- name: GetFlowScenariosWithDetails :many
SELECT fs.scenario_id, fs.order_num, s.name, s.url, s.status
FROM flow_scenario fs
JOIN scenario s ON s.id = fs.scenario_id
WHERE fs.flow_id = $1
ORDER BY fs.order_num;
