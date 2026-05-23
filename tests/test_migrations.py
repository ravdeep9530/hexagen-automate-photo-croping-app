import sqlite3
import pytest

IMAGE_PRESET_SQL = '''
CREATE TABLE IF NOT EXISTS ImagePreset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    settings TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
'''
DROP_IMAGE_PRESET_SQL = 'DROP TABLE IF EXISTS ImagePreset;'

USER_IMAGE_SQL = '''
CREATE TABLE IF NOT EXISTS UserImage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preset_id INTEGER,
    image_url TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (preset_id) REFERENCES ImagePreset(id)
);
'''
DROP_USER_IMAGE_SQL = 'DROP TABLE IF EXISTS UserImage;'

@pytest.fixture
def db():
    conn = sqlite3.connect(':memory:')
    yield conn
    conn.close()

def test_image_preset_table_creation_and_drop(db):
    db.execute(IMAGE_PRESET_SQL)
    # Check table exists
    cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ImagePreset'")
    assert cursor.fetchone() is not None
    # Drop table
    db.execute(DROP_IMAGE_PRESET_SQL)
    cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ImagePreset'")
    assert cursor.fetchone() is None

def test_user_image_table_creation_and_drop(db):
    db.execute(IMAGE_PRESET_SQL)
    db.execute(USER_IMAGE_SQL)
    # Check table exists
    cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='UserImage'")
    assert cursor.fetchone() is not None
    # Drop table
    db.execute(DROP_USER_IMAGE_SQL)
    cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='UserImage'")
    assert cursor.fetchone() is None

def test_user_image_relationship(db):
    db.execute(IMAGE_PRESET_SQL)
    db.execute(USER_IMAGE_SQL)
    # Insert into ImagePreset
    db.execute("INSERT INTO ImagePreset (name, description, settings, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))", ('Preset1', 'desc', '{}'))
    preset_id = db.execute("SELECT id FROM ImagePreset").fetchone()[0]
    # Insert into UserImage referencing preset_id
    db.execute("INSERT INTO UserImage (user_id, preset_id, image_url, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))", (1, preset_id, 'http://img.url', '{}'))
    row = db.execute("SELECT preset_id FROM UserImage").fetchone()
    assert row[0] == preset_id
