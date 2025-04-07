from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class ChatMessage(BaseModel):
    id: str = Field(..., alias="_id")
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime
    read: bool = False
    
class ChatContact(BaseModel):
    id: str = Field(..., alias="_id")
    username: str
    full_name: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None

