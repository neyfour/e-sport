from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Product(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0
    seller_id: str
    created_at: datetime
    updated_at: datetime

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0

