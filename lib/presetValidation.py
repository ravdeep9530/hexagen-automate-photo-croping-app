from typing import Dict, Any, Tuple, List

class PresetTemplate:
    def __init__(self, country_code: str, min_width: int, min_height: int, max_width: int, max_height: int):
        self.country_code = country_code
        self.min_width = min_width
        self.min_height = min_height
        self.max_width = max_width
        self.max_height = max_height

def validate_image_against_preset(image: Dict[str, Any], preset: PresetTemplate) -> Tuple[bool, List[str]]:
    """
    Validate image dimensions against the preset template.
    image: dict with 'width' and 'height' keys
    preset: PresetTemplate instance
    Returns (is_valid, errors)
    """
    errors = []
    width = image.get('width')
    height = image.get('height')
    if width is None or height is None:
        errors.append('Image dimensions missing.')
        return False, errors
    if width < preset.min_width:
        errors.append(f"Width {width} is less than minimum {preset.min_width}.")
    if width > preset.max_width:
        errors.append(f"Width {width} exceeds maximum {preset.max_width}.")
    if height < preset.min_height:
        errors.append(f"Height {height} is less than minimum {preset.min_height}.")
    if height > preset.max_height:
        errors.append(f"Height {height} exceeds maximum {preset.max_height}.")
    return len(errors) == 0, errors
