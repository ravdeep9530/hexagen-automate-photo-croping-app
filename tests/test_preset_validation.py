import pytest
from lib.presetValidation import PresetTemplate, validate_image_against_preset
from pages.api.image.upload import handle_image_upload

def test_valid_image_passes_validation():
    preset = PresetTemplate('US', 600, 400, 2000, 1500)
    image = {'width': 1000, 'height': 800}
    is_valid, errors = validate_image_against_preset(image, preset)
    assert is_valid
    assert errors == []

def test_image_too_small_fails():
    preset = PresetTemplate('US', 600, 400, 2000, 1500)
    image = {'width': 500, 'height': 399}
    is_valid, errors = validate_image_against_preset(image, preset)
    assert not is_valid
    assert 'Width 500 is less than minimum 600.' in errors
    assert 'Height 399 is less than minimum 400.' in errors

def test_image_too_large_fails():
    preset = PresetTemplate('US', 600, 400, 2000, 1500)
    image = {'width': 2100, 'height': 1600}
    is_valid, errors = validate_image_against_preset(image, preset)
    assert not is_valid
    assert 'Width 2100 exceeds maximum 2000.' in errors
    assert 'Height 1600 exceeds maximum 1500.' in errors

def test_missing_dimensions():
    preset = PresetTemplate('US', 600, 400, 2000, 1500)
    image = {'width': 1000}
    is_valid, errors = validate_image_against_preset(image, preset)
    assert not is_valid
    assert 'Image dimensions missing.' in errors

def test_handle_image_upload_success():
    image = {'width': 700, 'height': 500}
    resp = handle_image_upload(image, 'US')
    assert resp['success']
    assert resp['errors'] == []

def test_handle_image_upload_no_preset():
    image = {'width': 700, 'height': 500}
    resp = handle_image_upload(image, 'ZZ')
    assert not resp['success']
    assert 'No preset found for country ZZ.' in resp['errors'][0]

def test_handle_image_upload_validation_error():
    image = {'width': 100, 'height': 100}
    resp = handle_image_upload(image, 'US')
    assert not resp['success']
    assert any('less than minimum' in e for e in resp['errors'])
