import pytest
import json

@pytest.fixture
def user():
    return {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "images": [],
        "createdAt": "2024-06-01T00:00:00Z",
        "updatedAt": "2024-06-01T00:00:00Z"
    }

@pytest.fixture
def image(user):
    return {
        "id": 10,
        "url": "https://example.com/image.jpg",
        "metadata": {"width": 100, "height": 200},
        "userId": user["id"],
        "user": user,
        "createdAt": "2024-06-01T00:00:00Z",
        "updatedAt": "2024-06-01T00:00:00Z"
    }

def test_user_model_fields(user):
    assert "id" in user
    assert "email" in user
    assert "images" in user
    assert isinstance(user["images"], list)

def test_image_model_fields(image):
    assert "id" in image
    assert "url" in image
    assert "metadata" in image
    assert isinstance(image["metadata"], dict)
    assert "userId" in image
    assert "user" in image
    assert image["userId"] == image["user"]["id"]

def test_user_has_many_images(user):
    user["images"] = [
        {"id": 11, "url": "img1.jpg", "metadata": {}, "userId": user["id"], "user": user},
        {"id": 12, "url": "img2.jpg", "metadata": {}, "userId": user["id"], "user": user}
    ]
    assert len(user["images"]) == 2
    for img in user["images"]:
        assert img["userId"] == user["id"]

def test_image_belongs_to_user(image):
    assert image["userId"] == image["user"]["id"]
