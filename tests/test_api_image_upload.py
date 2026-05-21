import io
import sys
import os
import importlib.util
import types

# Dynamically import the src/api_image_upload.py module
SRC_PATH = os.path.join(os.path.dirname(__file__), '../src/api_image_upload.py')
spec = importlib.util.spec_from_file_location('api_image_upload', SRC_PATH)
api_image_upload = importlib.util.module_from_spec(spec)
sys.modules['api_image_upload'] = api_image_upload
spec.loader.exec_module(api_image_upload)

def test_upload_valid_image():
    filename = 'test_image.jpg'
    content_type = 'image/jpeg'
    content = b'\xff\xd8\xff'  # JPEG header bytes
    resp = api_image_upload.upload_image(filename, content_type, content)
    assert resp['success'] is True
    assert resp['filename'] == filename
    assert filename in api_image_upload.get_uploaded_images()

def test_upload_invalid_extension():
    filename = 'malicious.exe'
    content_type = 'application/octet-stream'
    content = b'fakecontent'
    resp = api_image_upload.upload_image(filename, content_type, content)
    assert resp['success'] is False
    assert resp['error'] == 'Invalid file type'

def test_upload_too_large():
    filename = 'big_image.png'
    content_type = 'image/png'
    content = b'0' * (5 * 1024 * 1024 + 1)  # Just over 5MB
    resp = api_image_upload.upload_image(filename, content_type, content)
    assert resp['success'] is False
    assert resp['error'] == 'File too large'

def test_list_images_accumulates():
    # Clear the store for this test
    api_image_upload.image_store.images.clear()
    files = [
        ('a.jpg', 'image/jpeg', b'1'),
        ('b.png', 'image/png', b'2'),
    ]
    for fname, ctype, content in files:
        api_image_upload.upload_image(fname, ctype, content)
    listed = api_image_upload.get_uploaded_images()
    assert set(listed) == {'a.jpg', 'b.png'}
