import uuid
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "viewer"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., max_length=72)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, max_length=72)

class UserResponse(UserBase):
    id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
