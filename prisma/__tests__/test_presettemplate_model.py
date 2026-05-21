import pytest
import sqlite3
from prisma.models.presettemplate import PresetTemplate

def setup_in_memory_db():
    conn = sqlite3.connect(":memory:")
    conn.execute("""
        CREATE TABLE preset_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            country_code TEXT NOT NULL
        )
    """)
    return conn

def test_create_valid_presettemplate():
    conn = setup_in_memory_db()
    template = PresetTemplate.create(conn, name="Test Template", country_code="US")
    assert template.id == 1
    assert template.name == "Test Template"
    assert template.country_code == "US"
    # Fetch from DB to verify
    fetched = PresetTemplate.get_by_id(conn, 1)
    assert fetched is not None
    assert fetched.name == "Test Template"
    assert fetched.country_code == "US"

def test_country_code_validation():
    conn = setup_in_memory_db()
    with pytest.raises(ValueError) as exc:
        PresetTemplate.create(conn, name="Invalid Country", country_code="ZZ")
    assert "Invalid country_code" in str(exc.value)
