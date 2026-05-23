-- Migration: Create ImagePreset table
-- Up
CREATE TABLE IF NOT EXISTS ImagePreset (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Down
DROP TABLE IF EXISTS ImagePreset;
