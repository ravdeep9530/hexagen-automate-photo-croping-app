import pytest
from api.crop_service import detect_and_crop, CropResult

def test_crop_returns_result():
    result = detect_and_crop("tests/fixtures/sample.jpg")
    assert isinstance(result, CropResult)
    assert result.width > 0
    assert result.height > 0
    assert 0 <= result.confidence <= 1
