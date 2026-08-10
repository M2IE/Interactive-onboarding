CREATE TABLE IF NOT EXISTS scenario_version (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    scenario_id UUID NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    CONSTRAINT uq_scenario_version UNIQUE (scenario_id, version)
);

ALTER TABLE event DROP COLUMN IF EXISTS scenario_id;
ALTER TABLE event ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES scenario_version(id) ON DELETE CASCADE;

ALTER TABLE step DROP CONSTRAINT IF EXISTS uq_step_order;
ALTER TABLE step DROP CONSTRAINT IF EXISTS step_scenario_id_fkey;
ALTER TABLE step RENAME COLUMN scenario_id TO version_id;
ALTER TABLE step ADD CONSTRAINT step_version_id_fkey FOREIGN KEY (version_id) REFERENCES scenario_version(id) ON DELETE CASCADE;
ALTER TABLE step ADD CONSTRAINT uq_step_order UNIQUE (version_id, order_num);
