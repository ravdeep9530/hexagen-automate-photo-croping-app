from typing import Dict, Any
from lib.presetValidation import PresetTemplate, validate_image_against_preset

def get_preset_template_for_country(country_code: str) -> PresetTemplate:
    # In real code, this would fetch from DB or config. Here, hardcoded for demo.
    presets = {
        'US': PresetTemplate('US', 600, 400, 2000, 1500),
        'FR': PresetTemplate('FR', 500, 300, 1800, 1200),
    }
    return presets.get(country_code)

def handle_image_upload(image: Dict[str, Any], country_code: str) -> Dict[str, Any]:
    preset = get_preset_template_for_country(country_code)
    if not preset:
        return {'success': False, 'errors': [f'No preset found for country {country_code}.']}
    is_valid, errors = validate_image_against_preset(image, preset)
    if not is_valid:
        return {'success': False, 'errors': errors}
    # Proceed with upload (omitted)
    return {'success': True, 'errors': []}
