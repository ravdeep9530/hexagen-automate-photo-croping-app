import cv2
import json
from dataclasses import dataclass

@dataclass
class CropResult:
    x: int
    y: int
    width: int
    height: int
    confidence: float

def detect_and_crop(image_path: str) -> CropResult:
    img = cv2.imread(image_path)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0:
        h, w = img.shape[:2]
        return CropResult(0, 0, w, h, 0.5)
    x, y, w, h = faces[0]
    padding = 20
    return CropResult(max(0,x-padding), max(0,y-padding), w+2*padding, h+2*padding, 0.95)
