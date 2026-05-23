import sys
import os
import pytest

# Add src/models to sys.path for import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../models')))

from ImagePreset import ImagePreset
from Workspace import Workspace

def setup_function():
    ImagePreset.clear_instances()
    Workspace.clear_instances()

def test_imagepreset_creation():
    preset = ImagePreset(name="Thumbnail", crop_ratio="16:9", default_filters=["brightness", "contrast"])
    assert preset.id == 1
    assert preset.name == "Thumbnail"
    assert preset.crop_ratio == "16:9"
    assert preset.default_filters == ["brightness", "contrast"]
    assert preset.workspace is None

def test_imagepreset_workspace_relationship():
    ws = Workspace(name="Design Team")
    preset = ImagePreset(name="Banner", crop_ratio="4:1", workspace=ws)
    assert preset.workspace == ws
    assert preset in ws.image_presets
    assert ws.image_presets[0].name == "Banner"

def test_workspace_add_image_preset():
    ws = Workspace(name="Marketing")
    preset = ImagePreset(name="Ad", crop_ratio="1:1")
    ws.add_image_preset(preset)
    assert preset.workspace == ws
    assert preset in ws.image_presets

def test_multiple_imagepresets_in_workspace():
    ws = Workspace(name="Editorial")
    p1 = ImagePreset(name="Cover", crop_ratio="2:3", workspace=ws)
    p2 = ImagePreset(name="Profile", crop_ratio="1:1", workspace=ws)
    assert p1.workspace == ws
    assert p2.workspace == ws
    assert len(ws.image_presets) == 2
    assert set(ws.image_presets) == {p1, p2}
