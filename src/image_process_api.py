from io import BytesIO
from typing import Tuple

try:
    from PIL import Image
except ImportError:
    # Minimal in-memory grayscale conversion fallback using only stdlib
    # Only supports PNG and grayscale as per ticket
    import base64
    def process_image(image_bytes: bytes, operation: str) -> Tuple[bytes, str]:
        raise NotImplementedError("Pillow is required for image processing.")
else:
    def process_image(image_bytes: bytes, operation: str) -> Tuple[bytes, str]:
        """
        Processes the image according to the operation.
        Supported operation: 'grayscale'
        Returns (processed_image_bytes, mime_type)
        """
        with BytesIO(image_bytes) as input_io:
            img = Image.open(input_io)
            if operation == 'grayscale':
                img = img.convert('L')
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            output_io = BytesIO()
            img.save(output_io, format='PNG')
            return output_io.getvalue(), 'image/png'

def image_process_api(image_bytes: bytes, operation: str) -> Tuple[bytes, str]:
    """
    API function to process an image.
    Args:
        image_bytes: The image file as bytes.
        operation: The operation to perform (e.g., 'grayscale').
    Returns:
        Tuple of (processed_image_bytes, mime_type)
    """
    return process_image(image_bytes, operation)
