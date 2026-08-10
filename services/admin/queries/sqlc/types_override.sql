CREATE TYPE scenario_status AS ENUM (
    'draft',
    'published',
    'archived'
);

CREATE TYPE event_type AS ENUM (
    'step_viewed',
    'step_completed',
    'scenario_completed',
    'scenario_dismissed'
);
