from flask import Blueprint, request, jsonify
from api.crop_service import detect_and_crop
import tempfile, os

crop_bp = Blueprint("crop", __name__)

@crop_bp.route("/api/crop", methods=["POST"])
def crop_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    f = request.files["image"]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        f.save(tmp.name)
        result = detect_and_crop(tmp.name)
        os.unlink(tmp.name)
    return jsonify({"x": result.x, "y": result.y, "width": result.width, "height": result.height, "confidence": result.confidence})
