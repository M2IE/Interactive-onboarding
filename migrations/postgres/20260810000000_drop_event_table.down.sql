CREATE TYPE event_type AS ENUM (
    'step_viewed',
    'step_completed',
    'scenario_completed',
    'scenario_dismissed'
);

CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES scenario(id) ON DELETE CASCADE,
    step_id UUID REFERENCES step(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    type event_type NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
