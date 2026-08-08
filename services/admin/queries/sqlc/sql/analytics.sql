-- name: GetAnalytics :one
SELECT
    COUNT(*) FILTER (WHERE e.type = 'step_viewed' AND s.order_num = 1)::int AS total_views,
    COUNT(*) FILTER (WHERE e.type = 'scenario_completed')::int AS completed,
    COUNT(*) FILTER (WHERE e.type = 'scenario_dismissed')::int AS dismissed
FROM event e
LEFT JOIN step s ON s.id = e.step_id
WHERE e.scenario_id = $1;

-- name: GetStepAnalytics :many
SELECT
    s.id AS step_id,
    s.title,
    s.order_num,
    COUNT(e.id) FILTER (WHERE e.type = 'step_viewed')::int AS views,
    COUNT(e.id) FILTER (WHERE e.type = 'step_completed')::int AS completed
FROM step s
LEFT JOIN event e ON e.step_id = s.id AND e.scenario_id = $1
WHERE s.scenario_id = $1
GROUP BY s.id, s.title, s.order_num
ORDER BY s.order_num;
