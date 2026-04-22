PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
    profile_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (profile_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_profile_created
ON favorites(profile_id, created_at DESC);
