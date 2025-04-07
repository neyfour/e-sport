from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    ORDER_STATUS = "order_status"
    NEW_ORDER = "new_order"
    SELLER_APPLICATION = "seller_application"
    ROLE_UPDATE = "role_update"
    SYSTEM = "system"

class NotificationBase(BaseModel):
    user_id: Optional[str] = None  # None for all superadmins
    type: NotificationType
    title: str
    message: str
    read: bool = False
    created_at: datetime
    data: Dict[str, Any] = {}

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

class NotificationInDB(NotificationBase):
    id: str = Field(..., alias="_id")

