from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.deps import get_current_active_user
from app.schemas.user import UserResponse, UserUpdate
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()

class RegisterRequest(BaseModel):
    company_name: str
    full_name: str
    email: str
    password: str = Field(..., max_length=72)

class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., max_length=72)

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create company
    company = Company(name=payload.company_name)
    db.add(company)
    db.flush() # get company.id
    
    # Process name
    # First/last names not used by User model explicitly, keeping full_name only

    # Create user
    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        company_id=company.id,
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    access_token = create_access_token(subject=new_user.email)
    refresh_token = create_refresh_token(subject=new_user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": payload.full_name,
            "company_id": str(company.id),
            "role": new_user.role
        }
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    print(f"DEBUG LOGIN: email='{payload.email}', password='{payload.password}'")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or user.email,
            "company_id": str(user.company_id),
            "role": user.role
        }
    }

@router.post("/refresh")
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    # In a real app, verify the refresh token signature and expiry.
    # For now, we trust the refresh flow if valid structure.
    from jose import jwt, JWTError
    from app.core import security
    from app.config import settings
    try:
        token_payload = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = token_payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    access_token = create_access_token(subject=user.email)
    new_refresh_token = create_refresh_token(subject=user.email)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or user.email,
            "company_id": str(user.company_id),
            "role": user.role
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_active_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "company_id": str(current_user.company_id),
        "role": current_user.role
    }

@router.put("/me")
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if payload.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = payload.email
        
    if payload.full_name:
        current_user.full_name = payload.full_name
        
    if payload.password:
        current_user.password_hash = get_password_hash(payload.password)
        
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "company_id": str(current_user.company_id),
            "role": current_user.role
        }
    }
