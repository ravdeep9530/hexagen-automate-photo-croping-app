import io
from typing import List

def allowed_file(filename: str) -> bool:
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

class InMemoryImageStore:
    def __init__(self):
        self.images = []  # Each image is a dict with keys: filename, content_type, content

    def save_image(self, filename: str, content_type: str, content: bytes):
        self.images.append({
            'filename': filename,
            'content_type': content_type,
            'content': content
        })

    def list_images(self) -> List[str]:
        return [img['filename'] for img in self.images]

# Singleton in-memory store for demonstration
image_store = InMemoryImageStore()

def upload_image(filename: str, content_type: str, content: bytes) -> dict:
    if not allowed_file(filename):
        return {"success": False, "error": "Invalid file type"}
    if len(content) > 5 * 1024 * 1024:
        return {"success": False, "error": "File too large"}
    image_store.save_image(filename, content_type, content)
    return {"success": True, "filename": filename}

def get_uploaded_images() -> List[str]:
    return image_store.list_images()
