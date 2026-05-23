from typing import Dict, List, Optional

class UserImage:
    def __init__(self, asset_id: str, metadata: Optional[Dict] = None, transformations: Optional[List[Dict]] = None):
        self.asset_id = asset_id
        self.metadata = metadata or {}
        self.transformations = transformations or []
        self.preset_applications = []  # List of PresetApplication instances

    def add_preset_application(self, preset_application):
        if preset_application not in self.preset_applications:
            self.preset_applications.append(preset_application)
            preset_application.user_image = self

    def remove_preset_application(self, preset_application):
        if preset_application in self.preset_applications:
            self.preset_applications.remove(preset_application)
            preset_application.user_image = None
