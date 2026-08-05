CREATE UNIQUE INDEX IF NOT EXISTS uq_scenario_project_url_draft ON scenario (project_id, url) WHERE status = 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS uq_scenario_project_url_published ON scenario (project_id, url) WHERE status = 'published';
