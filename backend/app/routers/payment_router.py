"""Payment routes - Stripe integration."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import stripe

from ..config import settings
from ..auth import get_current_user
from .. import models

router = APIRouter(prefix="/payment", tags=["payment"])


class CreateCheckoutSessionRequest(BaseModel):
    """Request body for creating a checkout session."""
    items: list[dict]  # [{"product_id": 1, "quantity": 2}, ...]
    shipping_address: str
    success_url: str = "http://localhost:5173/orders"
    cancel_url: str = "http://localhost:5173/cart"


@router.post("/create-checkout-session")
def create_checkout_session(
    body: CreateCheckoutSessionRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Create a Stripe Checkout session for payment."""
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Payment processing is not configured. Use COD for now.",
        )
    stripe.api_key = settings.stripe_secret_key

    line_items = []
    for item in body.items:
        line_items.append({
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": item.get("name", f"Product {item['product_id']}"),
                    "description": item.get("description", ""),
                },
                "unit_amount": int(item["price"] * 100),  # Stripe uses cents
            },
            "quantity": item["quantity"],
        })

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=body.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=body.cancel_url,
            metadata={
                "user_id": str(current_user.id),
                "shipping_address": body.shipping_address[:500],
            },
        )
        return {"url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
