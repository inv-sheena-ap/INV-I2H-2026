"""
Pydantic schemas for API request/response validation.
Used by FastAPI for serialization and validation (email, password strength, pincode, etc.).
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


# ---- User ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)  # BUG 34: no min_length=8 or strength for bug hunt
    full_name: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    phone: Optional[str] = Field(None, max_length=20)

    # BUG 34: password strength validator removed for bug hunt
    # @field_validator("password")
    # @classmethod
    # def password_strength(cls, v: str) -> str: ...


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---- Address ----
class AddressCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=100)
    line1: str = Field(..., min_length=1, max_length=255)
    line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=5, max_length=6, pattern=r"^\d{5,6}$")  # BUG 21
    phone: Optional[str] = Field(None, min_length=10, max_length=20, pattern=r"^\d{10,20}$")
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    line1: Optional[str] = Field(None, min_length=1, max_length=255)
    line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=6, pattern=r"^\d{6}$")
    phone: Optional[str] = Field(None, min_length=10, max_length=20, pattern=r"^\d{10,20}$")
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    id: int
    label: str
    line1: str
    line2: Optional[str]
    city: str
    state: str
    pincode: str
    phone: Optional[str] = None
    is_default: bool

    class Config:
        from_attributes = True


# ---- Product ----
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)
    category: str = Field(..., min_length=1, max_length=100)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_path: Optional[str] = None
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Order ----
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address_id: int = Field(..., gt=0)
    payment_method: str = "cod"


class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    product_name: Optional[str] = None
    product_image_path: Optional[str] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total: float
    status: str
    payment_method: str
    shipping_address_text: str
    shipping_pincode: Optional[str]
    expected_delivery_date: Optional[datetime]
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ---- Delivery (pincode) ----
class DeliveryCheckRequest(BaseModel):
    pincode: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class DeliveryCheckResponse(BaseModel):
    valid: bool
    expected_delivery_days: Optional[int] = None
    expected_delivery_date: Optional[datetime] = None  # ISO date for display
    message: str
