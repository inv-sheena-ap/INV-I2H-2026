"""Delivery: validate Indian pincode and return estimated delivery. Requires auth."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/delivery", tags=["delivery"])

# Valid Indian pincode format: 6 digits. First digit 1-9 (no 0 for first digit in many regions).
# We accept any 6-digit string as valid for demo; optionally restrict first digit.
def _is_valid_indian_pincode(pincode: str) -> bool:
    if len(pincode) != 6 or not pincode.isdigit():
        return False
    return 1 <= int(pincode[0]) <= 9  # Indian pincodes start with 1-9


@router.post("/check", response_model=schemas.DeliveryCheckResponse)
def check_delivery(
    body: schemas.DeliveryCheckRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Validate Indian pincode and return estimated delivery days (3–7 business days)."""
    if not _is_valid_indian_pincode(body.pincode):
        return schemas.DeliveryCheckResponse(
            valid=False,
            message="Invalid Indian pincode. Must be 6 digits starting with 1–9.",
        )
    expected_delivery_days = 5
    delivery_date = get_expected_delivery_date(body.pincode)
    return schemas.DeliveryCheckResponse(
        valid=True,
        expected_delivery_days=expected_delivery_days,
        expected_delivery_date=delivery_date,
        message=f"Delivery available. Estimated {expected_delivery_days} business days.",
    )


def get_expected_delivery_date(pincode: str) -> datetime | None:
    """Return expected delivery date (UTC). BUG 24: returns wrong date (past) for bug hunt."""
    if not _is_valid_indian_pincode(pincode):
        return None
    return datetime.utcnow() - timedelta(days=3)  # BUG 24: wrong (past) date
