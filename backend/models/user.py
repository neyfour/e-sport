from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    SELLER = "seller"
    SUPERADMIN = "superadmin"

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(..., alias="_id")
    role: UserRole = UserRole.CUSTOMER
    created_at: datetime
    balance: float = 0
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class SellerApplication(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    business_name: str
    business_type: str
    description: str
    address: str
    phone: str
    tax_id: Optional[str] = None
    status: str  # pending, approved, rejected
    created_at: datetime

