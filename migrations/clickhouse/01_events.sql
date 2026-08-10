CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.events(
    id          UUID,
    project_id  UUID,
    scenario_id UUID,
    step_id     Nullable(UUID),
    session_id  String,
    type        LowCardinality(String),
    event_key   String,
    created_at  DateTime64(3, 'UTC') DEFAULT now64()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, scenario_id, created_at);
