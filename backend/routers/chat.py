from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
import os
import json
from pymongo import MongoClient

# Import from users.py
from .users import get_current_user, get_current_active_user

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()

@router.get("/messages", response_model=List[Dict[str, Any]])
async def get_chat_messages(
    current_user: dict = Depends(get_current_active_user),
    other_user_id: str = None,
    skip: int = 0,
    limit: int = 50
):
    # Build query
    query = {}
    
    if other_user_id:
        # Get messages between current user and other user
        query = {
            "$or": [
                {"sender_id": current_user["_id"], "receiver_id": other_user_id},
                {"sender_id": other_user_id, "receiver_id": current_user["_id"]}
            ]
        }
    else:
        # Get all messages for current user
        query = {
            "$or": [
                {"sender_id": current_user["_id"]},
                {"receiver_id": current_user["_id"]}
            ]
        }
    
    # Get messages
    messages = list(
        db.chat_messages.find(query)
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for message in messages:
        message["_id"] = str(message["_id"])
        message["sender_id"] = str(message["sender_id"])
        if message["receiver_id"]:
            message["receiver_id"] = str(message["receiver_id"])
        
        # Get sender details
        sender = db.users.find_one({"_id": ObjectId(message["sender_id"])})
        if sender:
            message["sender"] = {
                "_id": str(sender["_id"]),
                "username": sender["username"],
                "role": sender["role"],
                "full_name": sender.get("full_name")
            }
        
        # Get receiver details
        if message["receiver_id"]:
            receiver = db.users.find_one({"_id": ObjectId(message["receiver_id"])})
            if receiver:
                message["receiver"] = {
                    "_id": str(receiver["_id"]),
                    "username": receiver["username"],
                    "role": receiver["role"],
                    "full_name": receiver.get("full_name")
                }
    
    # Mark messages as read
    if other_user_id:
        db.chat_messages.update_many(
            {"sender_id": other_user_id, "receiver_id": current_user["_id"], "read": False},
            {"$set": {"read": True}}
        )
    
    # Reverse to get chronological order
    messages.reverse()
    
    return messages

@router.get("/contacts", response_model=List[Dict[str, Any]])
async def get_chat_contacts(
    current_user: dict = Depends(get_current_active_user)
):
    # For superadmin, get all sellers
    if current_user["role"] == "superadmin":
        sellers = list(db.users.find({"role": "seller"}))
        
        contacts = []
        for seller in sellers:
            # Get unread message count
            unread_count = db.chat_messages.count_documents({
                "sender_id": str(seller["_id"]),
                "receiver_id": current_user["_id"],
                "read": False
            })
            
            # Get last message
            last_message = db.chat_messages.find_one(
                {
                    "$or": [
                        {"sender_id": current_user["_id"], "receiver_id": str(seller["_id"])},
                        {"sender_id": str(seller["_id"]), "receiver_id": current_user["_id"]}
                    ]
                },
                sort=[("timestamp", -1)]
            )
            
            contacts.append({
                "user_id": str(seller["_id"]),
                "username": seller["username"],
                "full_name": seller.get("full_name"),
                "role": seller["role"],
                "unread_count": unread_count,
                "last_message": last_message["content"] if last_message else None,
                "last_timestamp": last_message["timestamp"] if last_message else None
            })
        
        return contacts
    
    # For sellers, get superadmin
    elif current_user["role"] == "seller":
        superadmins = list(db.users.find({"role": "superadmin"}))
        
        contacts = []
        for admin in superadmins:
            # Get unread message count
            unread_count = db.chat_messages.count_documents({
                "sender_id": str(admin["_id"]),
                "receiver_id": current_user["_id"],
                "read": False
            })
            
            # Get last message
            last_message = db.chat_messages.find_one(
                {
                    "$or": [
                        {"sender_id": current_user["_id"], "receiver_id": str(admin["_id"])},
                        {"sender_id": str(admin["_id"]), "receiver_id": current_user["_id"]}
                    ]
                },
                sort=[("timestamp", -1)]
            )
            
            contacts.append({
                "user_id": str(admin["_id"]),
                "username": admin["username"],
                "full_name": admin.get("full_name"),
                "role": admin["role"],
                "unread_count": unread_count,
                "last_message": last_message["content"] if last_message else None,
                "last_timestamp": last_message["timestamp"] if last_message else None
            })
        
        return contacts
    
    # For other users, get all users who have exchanged messages with current user
    else:
        pipeline = [
            {
                "$match": {
                    "$or": [
                        {"sender_id": current_user["_id"]},
                        {"receiver_id": current_user["_id"]}
                    ]
                }
            },
            {
                "$group": {
                    "_id": {
                        "$cond": [
                            {"$eq": ["$sender_id", current_user["_id"]]},
                            "$receiver_id",
                            "$sender_id"
                        ]
                    },
                    "last_message": {"$last": "$content"},
                    "last_timestamp": {"$max": "$timestamp"},
                    "unread_count": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$eq": ["$receiver_id", current_user["_id"]]},
                                        {"$eq": ["$read", False]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {"$sort": {"last_timestamp": -1}}
        ]
        
        contacts = list(db.chat_messages.aggregate(pipeline))
        
        # Get user details for each contact
        result = []
        for contact in contacts:
            user_id = contact["_id"]
            user = db.users.find_one({"_id": ObjectId(user_id)})
            
            if user:
                result.append({
                    "user_id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "role": user["role"],
                    "last_message": contact["last_message"],
                    "last_timestamp": contact["last_timestamp"],
                    "unread_count": contact["unread_count"]
                })
        
        return result

@router.post("/send", response_model=Dict[str, Any])
async def send_message(
    message_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Validate receiver
    receiver_id = message_data.get("receiver_id")
    if not receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receiver ID is required"
        )
    
    receiver = db.users.find_one({"_id": ObjectId(receiver_id)})
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Validate content
    content = message_data.get("content")
    if not content or not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content is required"
        )
    
    # Create message
    message = {
        "sender_id": current_user["_id"],
        "receiver_id": receiver_id,
        "content": content,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    result = db.chat_messages.insert_one(message)
    
    # Create notification for receiver
    notification = {
        "user_id": receiver_id,
        "type": "chat_message",
        "title": "New Message",
        "message": f"You have a new message from {current_user['username']}",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "sender_id": current_user["_id"],
            "message_id": str(result.inserted_id)
        }
    }
    
    db.notifications.insert_one(notification)
    
    # Return created message
    message["_id"] = str(result.inserted_id)
    message["sender"] = {
        "_id": current_user["_id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user.get("full_name")
    }
    message["receiver"] = {
        "_id": receiver_id,
        "username": receiver["username"],
        "role": receiver["role"],
        "full_name": receiver.get("full_name")
    }
    
    return message

@router.put("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Get message
    message = db.chat_messages.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user is the receiver
    if message["receiver_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read"
        )
    
    # Mark as read
    db.chat_messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Message marked as read"}

@router.put("/messages/read-all")
async def mark_all_messages_as_read(
    sender_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Mark all messages from sender as read
    db.chat_messages.update_many(
        {
            "sender_id": sender_id,
            "receiver_id": current_user["_id"],
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return {"message": "All messages marked as read"}

