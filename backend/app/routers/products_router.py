"""Products API: list/search (authenticated user), CRUD + image (admin only)."""
import secrets
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, get_current_admin

router = APIRouter(prefix="/products", tags=["products"])

# Allowed MIME types for images (validated server-side)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Magic bytes for image validation (prevents non-image uploads)
JPEG_START = b"\xff\xd8\xff"
PNG_START = b"\x89PNG\r\n\x1a\n"
WEBP_RIFF = b"RIFF"
WEBP_WEBP = b"WEBP"


def _validate_image_file(file: UploadFile, content: bytes) -> None:
    """Validate image type and size. Raises HTTPException if invalid."""
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Image size must not exceed {settings.max_upload_size_mb} MB",
        )
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Allowed types: JPEG, PNG, WebP. Got: {file.content_type}",
        )
    # Verify actual image content (magic bytes) to prevent disguised executables
    valid = (
        content.startswith(JPEG_START)
        or content.startswith(PNG_START)
        or (content.startswith(WEBP_RIFF) and content[8:12] == WEBP_WEBP)
    )
    if not valid:
        raise HTTPException(status_code=400, detail="File is not a valid image (JPEG/PNG/WebP)")


@router.get("", response_model=list[schemas.ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search in name and description"),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
):
    """List products with optional filters. Authenticated users only."""
    query = db.query(models.Product)
    if search:
        search_escaped = search.replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            (models.Product.name.ilike(f"%{search_escaped}%"))
            | (models.Product.description.ilike(f"%{search_escaped}%"))
            | (models.Product.category.ilike(f"%{search_escaped}%"))
        )
    if category:
        query = query.filter(models.Product.category == category)
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    return query.all()


@router.get("/categories", response_model=list[str])
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Distinct product categories. Authenticated users only."""
    rows = db.query(models.Product.category).distinct().all()
    return [r[0] for r in rows if r[0]]


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---- Admin only ----
@router.post("", response_model=schemas.ProductResponse, status_code=201)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    db_product = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        category=product.category,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = product.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(db_product, k, v)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.patch("/{product_id}/stock")
def update_stock(
    product_id: int,
    stock: int = Query(..., ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.stock = stock
    db.commit()
    return {"id": product_id, "stock": db_product.stock}


@router.post("/{product_id}/image", response_model=schemas.ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    """Upload image for product. Replaces existing. Allowed: JPEG, PNG, WebP; max 5MB."""
    from ..config import UPLOAD_DIR

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    content = await file.read()
    _validate_image_file(file, content)

    ext = (Path(file.filename or "").suffix or ".jpg").lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    safe_name = f"product_{product_id}_{secrets.token_hex(8)}{ext}"
    path = UPLOAD_DIR / safe_name
    with open(path, "wb") as f:
        f.write(content)

    # Remove old image file if any
    if product.image_path:
        old_path = UPLOAD_DIR / Path(product.image_path).name
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass

    product.image_path = safe_name
    db.commit()
    db.refresh(product)
    return product
