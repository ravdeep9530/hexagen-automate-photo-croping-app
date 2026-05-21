import sqlite3
from typing import Optional

class PresetTemplate:
    VALID_COUNTRY_CODES = {'US', 'CA', 'GB', 'FR', 'DE', 'JP', 'CN', 'IN'}  # Example set

    def __init__(self, id: int, name: str, country_code: str):
        self.id = id
        self.name = name
        self.country_code = country_code
        self.validate()

    def validate(self):
        if self.country_code not in self.VALID_COUNTRY_CODES:
            raise ValueError(f"Invalid country_code: {self.country_code}")

    @classmethod
    def create(cls, conn: sqlite3.Connection, name: str, country_code: str) -> 'PresetTemplate':
        # Validate before insert
        if country_code not in cls.VALID_COUNTRY_CODES:
            raise ValueError(f"Invalid country_code: {country_code}")
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO preset_templates (name, country_code) VALUES (?, ?)",
            (name, country_code)
        )
        conn.commit()
        return cls(cur.lastrowid, name, country_code)

    @classmethod
    def get_by_id(cls, conn: sqlite3.Connection, id: int) -> Optional['PresetTemplate']:
        cur = conn.cursor()
        cur.execute("SELECT id, name, country_code FROM preset_templates WHERE id = ?", (id,))
        row = cur.fetchone()
        if row:
            return cls(*row)
        return None
