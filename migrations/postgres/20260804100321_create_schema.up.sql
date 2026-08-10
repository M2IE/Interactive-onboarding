
DO $$
BEGIN
    CREATE TYPE scenario_status AS ENUM (
        'draft',
        'published',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE event_type AS ENUM (
        'step_viewed',
        'step_completed',
        'scenario_completed',
        'scenario_dismissed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS project (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name TEXT NOT NULL,
    project_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status scenario_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_version (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    scenario_id UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    CONSTRAINT uq_scenario_version UNIQUE (scenario_id, version)
);

CREATE TABLE IF NOT EXISTS step (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    version_id UUID NOT NULL REFERENCES scenario_version(id) ON DELETE CASCADE,
    order_num INTEGER NOT NULL CHECK (order_num > 0),
    selector TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,

    CONSTRAINT uq_step_order UNIQUE (version_id, order_num)
);

CREATE TABLE IF NOT EXISTS event (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES scenario_version(id) ON DELETE CASCADE,
    step_id UUID REFERENCES step(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    type event_type NOT NULL,
    event_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
