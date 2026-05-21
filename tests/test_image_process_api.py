import io
import sys
import types
import pytest

# Patch sys.modules to simulate PIL absence for fallback coverage
def test_import_error_fallback(monkeypatch):
    monkeypatch.setitem(sys.modules, 'PIL', None)
    import importlib
    import src.image_process_api as ipa
    importlib.reload(ipa)
    with pytest.raises(NotImplementedError):
        ipa.process_image(b'', 'grayscale')


def make_test_image_bytes():
    # Create a simple 2x2 RGB PNG image in memory
    try:
        from PIL import Image
    except ImportError:
        pytest.skip("Pillow not installed")
    img = Image.new('RGB', (2, 2), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

def test_grayscale_conversion():
    # Only run if Pillow is installed
    try:
        from PIL import Image
    except ImportError:
        pytest.skip("Pillow not installed")
    from src.image_process_api import image_process_api
    orig_bytes = make_test_image_bytes()
    out_bytes, mime = image_process_api(orig_bytes, 'grayscale')
    assert mime == 'image/png'
    # Check output is a PNG and is grayscale
    buf = io.BytesIO(out_bytes)
    img = Image.open(buf)
    assert img.mode == 'L'  # grayscale
    assert img.size == (2, 2)

def test_invalid_operation():
    try:
        from PIL import Image
    except ImportError:
        pytest.skip("Pillow not installed")
    from src.image_process_api import image_process_api
    orig_bytes = make_test_image_bytes()
    with pytest.raises(ValueError):
        image_process_api(orig_bytes, 'invert')
