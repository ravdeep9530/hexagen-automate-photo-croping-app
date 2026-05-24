from typing import Optional

class PresetApplication:
    def __init__(self, name: str, user_image: Optional['UserImage'] = None):
        self.name = name
        self.user_image = user_image
        if user_image:
            user_image.add_preset_application(self)

    def __repr__(self):
        return f"<PresetApplication name={self.name} user_image_asset_id={self.user_image.asset_id if self.user_image else None}>"
