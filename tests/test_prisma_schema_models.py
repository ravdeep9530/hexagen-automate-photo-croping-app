import os
import tempfile
import subprocess
import shutil
import pytest

SCHEMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../prisma/schema.prisma'))

@pytest.mark.skipif(
    not shutil.which("prisma"),
    reason="Prisma CLI not installed; skipping integration test."
)
def test_prisma_schema_compiles():
    # Try to run `prisma format` to check schema validity
    result = subprocess.run([
        "prisma", "format", "--schema", SCHEMA_PATH
    ], capture_output=True, text=True)
    assert result.returncode == 0, f"Prisma schema failed to format: {result.stderr}"

def test_userimage_model_in_schema():
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
    assert 'model UserImage' in schema, "UserImage model missing from schema"
    assert 'userId    Int' in schema, "userId field missing in UserImage"
    assert 'url       String' in schema, "url field missing in UserImage"
    assert 'createdAt DateTime @default(now())' in schema, "createdAt field missing or incorrect in UserImage"
    assert 'updatedAt DateTime @updatedAt' in schema, "updatedAt field missing or incorrect in UserImage"
    assert '@relation(fields: [userId], references: [id])' in schema, "Relation annotation missing in UserImage"

def test_user_model_has_images_relation():
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
    assert 'images    UserImage[]' in schema, "User model missing images relation to UserImage[]"
