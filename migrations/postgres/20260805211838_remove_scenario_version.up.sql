ALTER TABLE step DROP CONSTRAINT IF EXISTS step_version_id_fkey;
ALTER TABLE step DROP CONSTRAINT IF EXISTS uq_step_order;

ALTER TABLE step RENAME COLUMN version_id TO scenario_id;
ALTER TABLE step ADD CONSTRAINT step_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES scenario(id) ON DELETE CASCADE;
ALTER TABLE step ADD CONSTRAINT uq_step_order UNIQUE (scenario_id, order_num);

ALTER TABLE event DROP COLUMN IF EXISTS version_id;
ALTER TABLE event ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenario(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS scenario_version;
