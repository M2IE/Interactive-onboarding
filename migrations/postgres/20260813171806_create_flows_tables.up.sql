-- Создание таблицы потоков
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    flow_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flows_project_key ON flows (project_id, flow_key);

-- Таблица связи потоков и сценариев
CREATE TABLE IF NOT EXISTS flow_scenario (
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    order_num INT NOT NULL CHECK (order_num > 0),
    PRIMARY KEY (flow_id, order_num),
    UNIQUE (flow_id, scenario_id)
);