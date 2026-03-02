"""
Seed the database with sample products and a default admin user.
Run once after DB is created. Idempotent: skips if products already exist.
Product images: save files as product_1.jpg ... product_20.jpg in backend/uploads/
(see docs/IMAGES_NEEDED.md for prompts to generate images with Gemini).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.auth import get_password_hash
from app.config import settings
from app.database import SessionLocal, engine
from app.models import Base, Product, User

UPLOAD_DIR = Path(__file__).resolve().parent / settings.upload_dir
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 20 products; image_path set to product_N.jpg (place images in backend/uploads/)
PRODUCTS = [
    {"name": "Wireless Mouse", "description": "Ergonomic wireless mouse with long battery life.", "price": 29.99, "stock": 100, "category": "Electronics"},
    {"name": "USB-C Cable", "description": "Fast charging USB-C cable 2m length.", "price": 12.99, "stock": 200, "category": "Electronics"},
    {"name": "Desk Lamp", "description": "LED desk lamp with adjustable brightness.", "price": 45.00, "stock": 50, "category": "Home"},
    {"name": "Notebook Set", "description": "Pack of 3 ruled notebooks A4 size.", "price": 8.99, "stock": 150, "category": "Office"},
    {"name": "Water Bottle", "description": "1L stainless steel insulated water bottle.", "price": 24.99, "stock": 80, "category": "Lifestyle"},
    {"name": "Bluetooth Headphones", "description": "Over-ear wireless headphones with noise cancellation.", "price": 89.99, "stock": 60, "category": "Electronics"},
    {"name": "Keyboard Stand", "description": "Adjustable laptop keyboard stand ergonomic.", "price": 35.00, "stock": 70, "category": "Office"},
    {"name": "Coffee Maker", "description": "Drip coffee maker 12-cup capacity.", "price": 59.99, "stock": 40, "category": "Home"},
    {"name": "Running Shoes", "description": "Lightweight running shoes for men and women.", "price": 79.99, "stock": 55, "category": "Lifestyle"},
    {"name": "Backpack", "description": "Laptop backpack with multiple compartments.", "price": 49.99, "stock": 90, "category": "Lifestyle"},
    {"name": "Monitor Arm", "description": "Single monitor mount desk clamp.", "price": 65.00, "stock": 45, "category": "Office"},
    {"name": "Phone Stand", "description": "Adjustable phone stand for desk.", "price": 14.99, "stock": 120, "category": "Electronics"},
    {"name": "Desk Organizer", "description": "Bamboo desk organizer with drawers.", "price": 28.00, "stock": 75, "category": "Office"},
    {"name": "Yoga Mat", "description": "Non-slip yoga mat 6mm thick.", "price": 32.99, "stock": 65, "category": "Lifestyle"},
    {"name": "Table Lamp", "description": "Modern table lamp with touch control.", "price": 38.00, "stock": 55, "category": "Home"},
    {"name": "Webcam HD", "description": "1080p webcam with built-in microphone.", "price": 54.99, "stock": 45, "category": "Electronics"},
    {"name": "Sticky Notes", "description": "Assorted color sticky notes 12 pads.", "price": 5.99, "stock": 200, "category": "Office"},
    {"name": "Throw Pillow", "description": "Decorative throw pillow cotton cover.", "price": 22.00, "stock": 85, "category": "Home"},
    {"name": "Fitness Tracker", "description": "Water-resistant fitness tracker with heart rate.", "price": 44.99, "stock": 70, "category": "Electronics"},
    {"name": "Plant Pot", "description": "Ceramic plant pot with drainage 6 inch.", "price": 18.99, "stock": 95, "category": "Home"},
]


def seed():
    """Create tables, insert products and admin user if not already present."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Product).first():
            print("Data already exists, skipping seed.")
            return
        for i, p in enumerate(PRODUCTS, start=1):
            # Image filename: place product_1.jpg ... product_20.jpg in backend/uploads/
            image_path = f"product_{i}.jpg"
            product = Product(
                name=p["name"],
                description=p["description"],
                price=p["price"],
                stock=p["stock"],
                category=p["category"],
                image_path=image_path,
            )
            db.add(product)
        admin = User(
            email="admin@shop.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
        )
        db.add(admin)
        db.commit()
        print("Seed completed. 20 products and admin user added.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
