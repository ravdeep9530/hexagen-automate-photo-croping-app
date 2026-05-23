from typing import Tuple

def upload_image_endpoint(image_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Accepts image bytes and filename, saves the image, and returns success status and path.
    """
    import os
    # For this example, save to a temp directory
    save_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    try:
        with open(save_path, 'wb') as f:
            f.write(image_bytes)
        return True, save_path
    except Exception as e:
        return False, str(e)
