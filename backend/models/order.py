from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    total: float
    seller_id: str
    image_url: Optional[str] = None

class ShippingAddress(BaseModel):
    full_name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    phone: str

class Order(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    items: List[OrderItem]
    total: float
    status: str  # pending, processing, shipped, delivered, cancelled, completed
    shipping_address: ShippingAddress
    payment_status: str  # pending, paid, failed
    payment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

