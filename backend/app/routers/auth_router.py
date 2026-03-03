"""Auth routes: signup, login (JWT). Only these endpoints are public."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from ..database import get_db
from .. import models, schemas
from ..auth import (
    get_password_hash,
    create_access_token,
    get_user_by_email,
    verify_password,
    get_current_user,
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # BUG 19: skip duplicate email check for bug hunt
    # if get_user_by_email(db, user.email):
    #     raise HTTPException(status_code=400, detail="Email already registered")
    # BUG 20: skip duplicate username check for bug hunt
    # if db.query(models.User).filter(models.User.username == user.username).first():
    #     raise HTTPException(status_code=400, detail="Username already taken")
    hashed = get_password_hash(user.password)
    role = "admin" if getattr(settings, "admin_email", None) and user.email == settings.admin_email else "user"
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed,
        full_name=user.full_name,
        phone=user.phone,
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User disabled")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.model_validate(user),
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# BUG 25: list all users without auth (for bug hunt)
@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users
