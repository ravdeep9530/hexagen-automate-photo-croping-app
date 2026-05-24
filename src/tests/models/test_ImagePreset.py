import pytest
from src.models.ImagePreset import ImagePreset
from src.models.Workspace import Workspace

def test_image_preset_creation():
    ws = Workspace(id=1, name='Main Workspace')
    preset = ImagePreset(id=10, name='Thumbnail', crop_ratio=1.5, default_filters=['blur', 'contrast'], workspace=ws)
    assert preset.id == 10
    assert preset.name == 'Thumbnail'
    assert preset.crop_ratio == 1.5
    assert preset.default_filters == ['blur', 'contrast']
    assert preset.workspace == ws
    d = preset.to_dict()
    assert d['id'] == 10
    assert d['name'] == 'Thumbnail'
    assert d['crop_ratio'] == 1.5
    assert d['default_filters'] == ['blur', 'contrast']
    assert d['workspace_id'] == 1

def test_workspace_imagepreset_relationship():
    ws = Workspace(id=2, name='Marketing')
    preset1 = ImagePreset(id=20, name='Banner', crop_ratio=2.0, default_filters=None, workspace=None)
    preset2 = ImagePreset(id=21, name='Icon', crop_ratio=1.0, default_filters=['sharpen'], workspace=None)
    ws.add_image_preset(preset1)
    ws.add_image_preset(preset2)
    assert preset1.workspace == ws
    assert preset2.workspace == ws
    assert preset1 in ws.image_presets
    assert preset2 in ws.image_presets
    # Ensure no duplicate
    ws.add_image_preset(preset1)
    assert ws.image_presets.count(preset1) == 1
    d = ws.to_dict()
    assert d['id'] == 2
    assert d['name'] == 'Marketing'
    assert set(d['image_presets']) == {20, 21}
