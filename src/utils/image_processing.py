from io import BytesIO

def sanitize_exif(image_bytes: bytes) -> bytes:
    """
    Removes EXIF metadata from JPEG image bytes.
    Returns sanitized image bytes.
    """
    # Minimal JPEG EXIF stripper: Remove APP1 marker (0xFFE1)
    # This is a naive implementation for demonstration purposes.
    # For production, use Pillow or similar, but here we avoid external deps.
    SOI = b'\xff\xd8'  # Start of Image
    EOI = b'\xff\xd9'  # End of Image
    pos = 0
    data = image_bytes
    if not data.startswith(SOI):
        raise ValueError("Not a JPEG file")
    output = bytearray()
    output += SOI
    pos = 2
    while pos < len(data):
        if data[pos] != 0xFF:
            # Not a marker, copy rest and break
            output += data[pos:]
            break
        marker = data[pos:pos+2]
        pos += 2
        if marker == b'\xff\xd9':  # EOI
            output += marker
            break
        if marker[1] == 0xD8:  # SOI
            continue
        if marker[1] == 0xDA:  # Start of Scan, copy rest
            output += marker
            output += data[pos:]
            break
        # Read segment length
        seg_len = int.from_bytes(data[pos:pos+2], 'big')
        seg_data = data[pos-2:pos+seg_len]
        if marker == b'\xff\xe1':
            # APP1 (EXIF), skip
            pos += seg_len
            continue
        else:
            output += seg_data
            pos += seg_len
    return bytes(output)
