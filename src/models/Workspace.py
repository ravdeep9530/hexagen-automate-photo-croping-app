from typing import List

class Workspace:
    _id_counter = 1
    _instances = []

    def __init__(self, name: str):
        self.id = Workspace._id_counter
        Workspace._id_counter += 1
        self.name = name
        self.image_presets: List = []
        Workspace._instances.append(self)

    def add_image_preset(self, image_preset):
        if image_preset not in self.image_presets:
            self.image_presets.append(image_preset)
            image_preset.workspace = self

    @classmethod
    def clear_instances(cls):
        cls._instances = []
        cls._id_counter = 1

    @classmethod
    def all(cls):
        return list(cls._instances)
