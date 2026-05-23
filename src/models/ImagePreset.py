from typing import Optional, List

class ImagePreset:
    _id_counter = 1
    _instances = []

    def __init__(self, name: str, crop_ratio: Optional[str] = None, default_filters: Optional[List[str]] = None, workspace=None):
        self.id = ImagePreset._id_counter
        ImagePreset._id_counter += 1
        self.name = name
        self.crop_ratio = crop_ratio
        self.default_filters = default_filters or []
        self.workspace = workspace
        ImagePreset._instances.append(self)
        if workspace:
            workspace.add_image_preset(self)

    @classmethod
    def clear_instances(cls):
        cls._instances = []
        cls._id_counter = 1

    @classmethod
    def all(cls):
        return list(cls._instances)
