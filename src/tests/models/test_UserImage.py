import pytest
from src.models.UserImage import UserImage
from src.models.PresetApplication import PresetApplication

def test_userimage_creation():
    asset_id = 'img123'
    metadata = {'format': 'jpeg', 'size': 2048}
    transformations = [{'type': 'resize', 'params': {'width': 100, 'height': 100}}]
    user_image = UserImage(asset_id, metadata, transformations)
    assert user_image.asset_id == asset_id
    assert user_image.metadata == metadata
    assert user_image.transformations == transformations
    assert user_image.preset_applications == []

def test_add_preset_application():
    user_image = UserImage('img123')
    preset_app = PresetApplication('presetA')
    user_image.add_preset_application(preset_app)
    assert preset_app in user_image.preset_applications
    assert preset_app.user_image == user_image

def test_remove_preset_application():
    user_image = UserImage('img123')
    preset_app = PresetApplication('presetA')
    user_image.add_preset_application(preset_app)
    user_image.remove_preset_application(preset_app)
    assert preset_app not in user_image.preset_applications
    assert preset_app.user_image is None

def test_relationship_bidirectional():
    user_image = UserImage('img123')
    preset_app1 = PresetApplication('presetA')
    preset_app2 = PresetApplication('presetB')
    user_image.add_preset_application(preset_app1)
    user_image.add_preset_application(preset_app2)
    assert preset_app1.user_image == user_image
    assert preset_app2.user_image == user_image
    assert preset_app1 in user_image.preset_applications
    assert preset_app2 in user_image.preset_applications
