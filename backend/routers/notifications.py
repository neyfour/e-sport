from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient

# Import from users.py
from .users import get_current_active_user

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_notifications(
    current_user: dict = Depends(get_current_active_user),
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50
):
    # Build query
    query = {"user_id": str(current_user["_id"])}
    
    # For superadmin, also get notifications with user_id = None
    if current_user["role"] == "superadmin":
        query = {
            "$or": [
                {"user_id": str(current_user["_id"])},
                {"user_id": None}
            ]
        }
    
    if unread_only:
        query["read"] = False
    
    # Get notifications
    notifications = list(
        db.notifications.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
        if notification["user_id"]:
            notification["user_id"] = str(notification["user_id"])
    
    return notifications

@router.get("/count", response_model=Dict[str, int])
async def get_notification_count(
    current_user: dict = Depends(get_current_active_user),
):
    # Build query for unread notifications
    query = {
        "user_id": current_user["_id"],
        "read": False
    }
    
    # For superadmin, also count notifications with user_id = None
    if current_user["role"] == "superadmin":
        query = {
            "$or": [
                {"user_id": current_user["_id"], "read": False},
                {"user_id": None, "read": False}
            ]
        }
    
    # Count unread notifications
    count = db.notifications.count_documents(query)
    
    return {"count": count}

@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Get notification
    notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user has permission to mark this notification as read
    if (notification["user_id"] and 
        notification["user_id"] != current_user["_id"] and 
        current_user["role"] != "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this notification"
        )
    
    # Update notification
    db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_active_user)
):
    # Build query
    query = {"user_id": current_user["_id"], "read": False}
    
    # For superadmin, also update notifications with user_id = None
    if current_user["role"] == "superadmin":
        query = {
            "$or": [
                {"user_id": current_user["_id"], "read": False},
                {"user_id": None, "read": False}
            ]
        }
    
    # Update all unread notifications
    result = db.notifications.update_many(
        query,
        {"$set": {"read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

@router.post("/", response_model=Dict[str, Any])
async def create_notification(
    notification_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin and superadmin can create notifications
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create notifications"
        )
    
    # Create notification
    notification = {
        "user_id": notification_data.get("user_id"),
        "type": notification_data.get("type"),
        "title": notification_data.get("title"),
        "message": notification_data.get("message"),
        "read": False,
        "created_at": datetime.utcnow(),
        "data": notification_data.get("data", {})
    }
    
    result = db.notifications.insert_one(notification)
    
    # Return created notification
    notification["_id"] = str(result.inserted_id)
    if notification["user_id"]:
        notification["user_id"] = str(notification["user_id"])
    
    return notification

# New endpoint to delete a specific notification
@router.delete("/{notification_id}", response_model=Dict[str, str])
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Get notification
    notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user has permission to delete this notification
    if (notification["user_id"] and 
        str(notification["user_id"]) != str(current_user["_id"]) and 
        current_user["role"] != "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )
    
    # Delete notification
    result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or already deleted"
        )
    
    return {"message": "Notification deleted successfully"}

# New endpoint to delete all notifications for a user
@router.delete("/", response_model=Dict[str, Any])
async def delete_all_notifications(
    current_user: dict = Depends(get_current_active_user)
):
    # Build query
    query = {"user_id": str(current_user["_id"])}
    
    # For superadmin, also delete notifications with user_id = None if they want
    if current_user["role"] == "superadmin":
        query = {
            "$or": [
                {"user_id": str(current_user["_id"])},
                {"user_id": None}
            ]
        }
    
    # Delete all notifications for the user
    result = db.notifications.delete_many(query)
    
    return {
        "message": "All notifications deleted successfully",
        "deleted_count": result.deleted_count
    }

