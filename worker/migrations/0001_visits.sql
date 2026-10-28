-- One row per visit; its id is the visitor number
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    country TEXT,
    region TEXT,
    city TEXT,
    timezone TEXT,
    asn INTEGER,
    org TEXT,
    -- SHA-256 of the IP, the UTC date and a secret salt, for unique visitors
    -- per day. The IP itself is never stored.
    ip_hash TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    language TEXT,
    entry TEXT,
    referrer TEXT,
    message_id TEXT,
    -- Lets the visitor's own page update its session, and nobody else
    edit_token TEXT NOT NULL,
    session TEXT,
    updated_at TEXT NOT NULL
);

CREATE INDEX visits_created_at ON visits (created_at);
CREATE INDEX visits_country ON visits (country);
