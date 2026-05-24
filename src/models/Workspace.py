from typing import List, Optional

class Workspace:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name
        self.image_presets: List['ImagePreset'] = []

    def add_image_preset(self, preset: 'ImagePreset'):
        if preset not in self.image_presets:
            self.image_presets.append(preset)
            preset.workspace = self

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'image_presets': [p.id for p in self.image_presets]
        }
