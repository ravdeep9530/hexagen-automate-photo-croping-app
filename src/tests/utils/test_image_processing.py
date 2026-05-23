from src.utils.image_processing import sanitize_exif

def make_jpeg_with_exif():
    # Minimal JPEG with EXIF (APP1) marker
    # SOI + APP1 + dummy EXIF + DQT + SOF0 + SOS + EOI
    SOI = b'\xff\xd8'
    APP1 = b'\xff\xe1' + (b'\x00\x10') + b'Exif\x00\x00' + b'12345678'  # 16 bytes
    DQT = b'\xff\xdb' + b'\x00\x43' + b'0'*67
    SOF0 = b'\xff\xc0' + b'\x00\x11' + b'0'*17
    SOS = b'\xff\xda' + b'\x00\x0c' + b'0'*12
    EOI = b'\xff\xd9'
    return SOI + APP1 + DQT + SOF0 + SOS + EOI

def make_jpeg_without_exif():
    SOI = b'\xff\xd8'
    DQT = b'\xff\xdb' + b'\x00\x43' + b'0'*67
    SOF0 = b'\xff\xc0' + b'\x00\x11' + b'0'*17
    SOS = b'\xff\xda' + b'\x00\x0c' + b'0'*12
    EOI = b'\xff\xd9'
    return SOI + DQT + SOF0 + SOS + EOI

def test_sanitize_exif_removes_app1():
    jpeg = make_jpeg_with_exif()
    sanitized = sanitize_exif(jpeg)
    # Should not contain APP1 marker
    assert b'Exif' not in sanitized
    assert b'\xff\xe1' not in sanitized
    # Should still be a valid JPEG (starts with SOI, ends with EOI)
    assert sanitized.startswith(b'\xff\xd8')
    assert sanitized.endswith(b'\xff\xd9')
    # Other segments remain
    assert b'\xff\xdb' in sanitized
    assert b'\xff\xc0' in sanitized
    assert b'\xff\xda' in sanitized

def test_sanitize_exif_no_exif():
    jpeg = make_jpeg_without_exif()
    sanitized = sanitize_exif(jpeg)
    # Should be unchanged
    assert jpeg == sanitized

def test_sanitize_exif_invalid_jpeg():
    not_jpeg = b'notajpegfile'
    try:
        sanitize_exif(not_jpeg)
    except ValueError as e:
        assert 'Not a JPEG file' in str(e)
    else:
        assert False, 'Expected ValueError for non-JPEG input'
