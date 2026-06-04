import pytest
from src.models.UserImage import UserImage
from src.models.PresetApplication import PresetApplication

def test_userimage_creation():
    asset_id = 'img123'
    metadata = {'format': 'png', 'size': 2048}
    transformations = ['resize', 'crop']
    user_image = UserImage(asset_id=asset_id, metadata=metadata, transformations=transformations)
    assert user_image.asset_id == asset_id
    assert user_image.metadata == metadata
    assert user_image.transformations == transformations
    assert user_image.preset_applications == []

def test_userimage_presetapplication_relationship():
    user_image = UserImage(asset_id='img456')
    preset1 = PresetApplication(name='Sepia')
    preset2 = PresetApplication(name='Grayscale')
    # Add preset applications to user image
    user_image.add_preset_application(preset1)
    user_image.add_preset_application(preset2)
    assert preset1.user_image == user_image
    assert preset2.user_image == user_image
    assert preset1 in user_image.preset_applications
    assert preset2 in user_image.preset_applications

def test_presetapplication_constructor_sets_userimage():
    user_image = UserImage(asset_id='img789')
    preset = PresetApplication(name='Invert', user_image=user_image)
    assert preset.user_image == user_image
    assert preset in user_image.preset_applications
