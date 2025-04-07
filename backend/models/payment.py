from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class Payment(BaseModel):
    id: str = Field(..., alias="_id")
    order_id: str
    user_id: str
    amount: float
    payment_method: str
    status: str  # pending, completed, failed
    transaction_id: str
    created_at: datetime

class PayoutRequest(BaseModel):
    id: str = Field(..., alias="_id")
    seller_id: str
    amount: float
    payment_method: str
    payment_details: Dict[str, Any]
    status: str  # pending, approved, rejected
    created_at: datetime
    updated_at: datetime
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None

