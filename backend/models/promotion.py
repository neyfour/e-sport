from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Promotion(BaseModel):
    id: str = Field(..., alias="_id")
    code: str
    title: Optional[str] = None
    description: Optional[str] = None
    discount_type: str  # percentage, fixed, free_shipping
    discount_value: float
    min_purchase: float = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    product_ids: List[str] = []
    categories: List[str] = []
    usage_limit: Optional[int] = None
    usage_count: int = 0
    seller_id: str
    created_at: datetime
    updated_at: datetime

