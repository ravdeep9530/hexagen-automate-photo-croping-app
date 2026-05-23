-- Migration: Create UserImage table
-- Up
CREATE TABLE IF NOT EXISTS UserImage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    preset_id INTEGER REFERENCES ImagePreset(id),
    image_url VARCHAR(512) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Down
DROP TABLE IF EXISTS UserImage;
