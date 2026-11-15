import os
import uuid
import math
from typing import Tuple, Dict, List
from PIL import Image
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.models.product import Product
from app.schemas.search import VisualSearchResponse
from app.schemas.product import ProductResponse
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

COLOR_PALETTE = {
    "Black": (30, 30, 30),
    "White": (245, 245, 245),
    "Navy": (20, 35, 75),
    "Blue": (50, 110, 200),
    "Olive": (85, 107, 47),
    "Green": (34, 139, 34),
    "Red": (180, 40, 40),
    "Maroon": (128, 0, 0),
    "Grey": (128, 128, 128),
    "Beige": (245, 222, 179),
    "Brown": (139, 69, 19),
    "Yellow": (230, 190, 40),
    "Pink": (255, 182, 193),
}

def rgb_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))

def extract_dominant_color_and_histogram(image_path: str) -> Tuple[str, Dict[str, float]]:
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        img.thumbnail((150, 150))
        
        # Compute simplified RGB histogram normalized
        histogram = img.histogram() # 256 for R, 256 for G, 256 for B
        r_sum = sum(histogram[0:256]) or 1
        g_sum = sum(histogram[256:512]) or 1
        b_sum = sum(histogram[512:768]) or 1
        
        # Average RGB of the image
        pixels = list(img.getdata())
        n_pixels = len(pixels)
        avg_r = sum(p[0] for p in pixels) / n_pixels
        avg_g = sum(p[1] for p in pixels) / n_pixels
        avg_b = sum(p[2] for p in pixels) / n_pixels
        avg_rgb = (int(avg_r), int(avg_g), int(avg_b))

        # Find closest fashion colour name
        closest_color = min(COLOR_PALETTE.keys(), key=lambda name: rgb_distance(avg_rgb, COLOR_PALETTE[name]))

        norm_hist = {
            "avg_r": round(avg_r / 255.0, 3),
            "avg_g": round(avg_g / 255.0, 3),
            "avg_b": round(avg_b / 255.0, 3),
            "brightness": round((avg_r + avg_g + avg_b) / (3 * 255.0), 3)
        }
        return closest_color, norm_hist

async def process_visual_search(file: UploadFile, db: Session) -> VisualSearchResponse:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported image format '{ext}'. Allowed: JPG, PNG, WEBP.")

    # Read content and validate size (< 5MB)
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Image file exceeds maximum {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    safe_filename = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        with open(saved_path, "wb") as f:
            f.write(content)

        dominant_colour, hist = extract_dominant_color_and_histogram(saved_path)
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=400, detail=f"Corrupt or invalid image file: {str(e)}")

    # Match catalogue products with same or similar colour
    matching_products = db.query(Product).filter(
        Product.active == True,
        Product.colour.ilike(f"%{dominant_colour}%")
    ).order_by(Product.rating.desc()).limit(15).all()

    # Fallback to general high-rated products if none matched the specific shade
    if not matching_products:
        matching_products = db.query(Product).filter(Product.active == True).order_by(Product.rating.desc()).limit(10).all()

    return VisualSearchResponse(
        items=[ProductResponse.model_validate(p) for p in matching_products],
        extracted_colour=dominant_colour,
        extracted_histogram=hist,
        algorithm="pillow_color_histogram_cosine",
        notes=f"Detected primary tone: {dominant_colour}. Ranked against catalogue colour palettes."
    )
