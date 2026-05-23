import os
import shutil
from src.api.images.upload import upload_image_endpoint

def setup_module(module):
    uploads_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'api', 'images', 'uploads')
    if os.path.exists(uploads_dir):
        shutil.rmtree(uploads_dir)

def teardown_module(module):
    uploads_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'api', 'images', 'uploads')
    if os.path.exists(uploads_dir):
        shutil.rmtree(uploads_dir)

def test_upload_image_success():
    image_bytes = b'fake-image-data'
    filename = 'test_image.png'
    success, path = upload_image_endpoint(image_bytes, filename)
    assert success is True
    assert os.path.exists(path)
    with open(path, 'rb') as f:
        assert f.read() == image_bytes

def test_upload_image_failure():
    # Simulate failure by passing invalid filename
    image_bytes = b'fake-image-data'
    filename = '/invalid/path/test_image.png'
    success, error = upload_image_endpoint(image_bytes, filename)
    assert success is False
    assert isinstance(error, str)
