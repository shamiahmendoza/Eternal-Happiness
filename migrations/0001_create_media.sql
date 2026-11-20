
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (
        media_type IN ('photo', 'video')
    ),
    r2_key TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_category
ON media(category);

CREATE INDEX IF NOT EXISTS idx_media_type
ON media(media_type);

CREATE INDEX IF NOT EXISTS idx_media_created_at
ON media(created_at);
