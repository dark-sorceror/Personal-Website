-- The random id the visitor's browser keeps, so someone who comes back is
-- one visitor across visits
ALTER TABLE visits ADD COLUMN visitor TEXT;
-- How long the site was showing, in all and page by page, as JSON:
-- [{"path": "/", "ms": 35000}]
ALTER TABLE visits ADD COLUMN duration_ms INTEGER;
ALTER TABLE visits ADD COLUMN pages TEXT;

CREATE INDEX visits_visitor ON visits (visitor);
