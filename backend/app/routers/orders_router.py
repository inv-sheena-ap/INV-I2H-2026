"""Orders API: create order (with address, COD), list orders. All require auth."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from .delivery_router import get_expected_delivery_date

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_response(order: models.Order) -> schemas.OrderResponse:
    """Build OrderResponse with product name and image for each item."""
    items = [
        schemas.OrderItemResponse(
            product_id=oi.product_id,
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            product_name=oi.product.name if oi.product else None,
            product_image_path=oi.product.image_path if oi.product else None,
        )
        for oi in order.items
    ]
    return schemas.OrderResponse(
        id=order.id,
        user_id=order.user_id,
        total=order.total,
        status=order.status,
        payment_method=order.payment_method,
        shipping_address_text=order.shipping_address_text,
        shipping_pincode=order.shipping_pincode,
        expected_delivery_date=order.expected_delivery_date,
        created_at=order.created_at,
        items=items,
    )


def _format_address(addr: models.UserAddress) -> str:
    parts = [addr.line1]
    if addr.line2:
        parts.append(addr.line2)
    parts.append(f"{addr.city}, {addr.state} - {addr.pincode}")
    return "\n".join(parts)


@router.post("", response_model=schemas.OrderResponse, status_code=201)
def create_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if order_data.payment_method != "cod":
        raise HTTPException(status_code=400, detail="Only cash on delivery is supported")

    # Resolve address (must belong to current user)
    addr = (
        db.query(models.UserAddress)
        .filter(
            models.UserAddress.id == order_data.address_id,
            models.UserAddress.user_id == current_user.id,
        )
        .first()
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    total = 0.0
    order_items = []
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        qty = item.quantity
        if qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        if product.stock < qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        total += product.price * qty
        order_items.append({
            "product_id": product.id,
            "quantity": qty,
            "unit_price": product.price,
        })
        product.stock -= qty

    shipping_text = _format_address(addr)
    expected_delivery = get_expected_delivery_date(addr.pincode)

    order = models.Order(
        user_id=current_user.id,
        total=round(total, 2),
        status="pending",
        payment_method="cod",
        shipping_address_text=shipping_text,
        shipping_pincode=addr.pincode,
        expected_delivery_date=expected_delivery,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    for oi in order_items:
        db_item = models.OrderItem(
            order_id=order.id,
            product_id=oi["product_id"],
            quantity=oi["quantity"],
            unit_price=oi["unit_price"],
        )
        db.add(db_item)
    db.commit()

    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order.id)
        .first()
    )
    return _order_to_response(order)


@router.get("", response_model=list[schemas.OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_order_to_response(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return _order_to_response(order)
