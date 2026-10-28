-- The project galleries opened during the visit, as a JSON array of their
-- topics (["lumen", "goosetriever"])
ALTER TABLE visits ADD COLUMN galleries TEXT;
