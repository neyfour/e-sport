import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[Dict[str, Any]]] = {}
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str = None):
        await websocket.accept()
        
        # Add to room connections
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        connection_info = {
            "websocket": websocket,
            "user_id": user_id,
            "connected_at": datetime.utcnow()
        }
        
        self.active_connections[room_id].append(connection_info)
        
        # Add to user connections
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        # Notify room about new connection
        if user_id:
            await self.broadcast_to_room(
                room_id,
                {
                    "type": "system",
                    "content": f"User {user_id} joined the room",
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=None  # Include all users
            )

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str = None):
        # Remove from room connections
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                conn for conn in self.active_connections[room_id] 
                if conn["websocket"] != websocket
            ]
            
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id] = [
                conn for conn in self.user_connections[user_id] 
                if conn != websocket
            ]
            
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any], exclude_user: str = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if exclude_user and connection["user_id"] == exclude_user:
                    continue
                
                await connection["websocket"].send_text(json.dumps(message))
    
    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        if user_id in self.user_connections:
            for websocket in self.user_connections[user_id]:
                await websocket.send_text(json.dumps(message))
    
    async def broadcast_notification(self, notification: Dict[str, Any]):
        target_user_id = notification.get("user_id")
        
        # If notification is for a specific user
        if target_user_id:
            await self.send_personal_message(target_user_id, {
                "type": "notification",
                "data": notification
            })
        # If notification is for all users (superadmins)
        else:
            for user_id, connections in self.user_connections.items():
                # Check if user is superadmin (this would require a database lookup)
                # For simplicity, we're sending to all users here
                for websocket in connections:
                    await websocket.send_text(json.dumps({
                        "type": "notification",
                        "data": notification
                    }))

