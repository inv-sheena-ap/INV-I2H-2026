"""User addresses CRUD. All endpoints require authentication."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/addresses", tags=["addresses"])


def _address_to_response(addr: models.UserAddress) -> schemas.AddressResponse:
    return schemas.AddressResponse(
        id=addr.id,
        label=addr.label,
        line1=addr.line1,
        line2=addr.line2,
        city=addr.city,
        state=addr.state,
        pincode=addr.pincode,
        phone=getattr(addr, "phone", None),
        is_default=addr.is_default,
    )


@router.get("", response_model=list[schemas.AddressResponse])
def list_addresses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    addrs = db.query(models.UserAddress).filter(models.UserAddress.user_id == current_user.id).all()
    return [_address_to_response(a) for a in addrs]


@router.post("", response_model=schemas.AddressResponse, status_code=201)
def create_address(
    body: schemas.AddressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if body.is_default:
        db.query(models.UserAddress).filter(models.UserAddress.user_id == current_user.id).update({"is_default": False})
    addr = models.UserAddress(
        user_id=current_user.id,
        label=body.label,
        line1=body.line1,
        line2=body.line2,
        city=body.city,
        state=body.state,
        pincode=body.pincode,
        phone=body.phone,
        is_default=body.is_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return _address_to_response(addr)


@router.get("/{address_id}", response_model=schemas.AddressResponse)
def get_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    addr = db.query(models.UserAddress).filter(
        models.UserAddress.id == address_id,
        models.UserAddress.user_id == current_user.id,
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return _address_to_response(addr)


@router.patch("/{address_id}", response_model=schemas.AddressResponse)
def update_address(
    address_id: int,
    body: schemas.AddressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    addr = db.query(models.UserAddress).filter(
        models.UserAddress.id == address_id,
        models.UserAddress.user_id == current_user.id,
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_default") is True:
        db.query(models.UserAddress).filter(models.UserAddress.user_id == current_user.id).update({"is_default": False})
    for k, v in data.items():
        setattr(addr, k, v)
    db.commit()
    db.refresh(addr)
    return _address_to_response(addr)


# BUG 29: delete any address by ID (no ownership check) for bug hunt
@router.delete("/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    addr = db.query(models.UserAddress).filter(models.UserAddress.id == address_id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return None
