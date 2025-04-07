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
async def get_seller_applications(
    current_user: dict = Depends(get_current_active_user),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    # Only admin and superadmin can access all applications
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    
    # Get applications with user details
    pipeline = [
        {"$match": query},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "user_id": {"$toString": "$user_id"},
                "business_name": 1,
                "business_type": 1,
                "category": 1,
                "description": 1,
                "status": 1,
                "submitted_at": 1,
                "updated_at": 1,
                "user.username": 1,
                "user.email": 1,
                "user.full_name": 1,
                "user._id": {"$toString": "$user._id"}
            }
        }
    ]
    
    applications = list(db.seller_applications.aggregate(pipeline))
    return applications

@router.post("/", response_model=Dict[str, Any])
async def create_seller_application(
    application_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Check if user already has a pending application
    existing_application = db.seller_applications.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "pending"
    })
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending application"
        )
    
    # Create new application
    application = {
        "user_id": ObjectId(current_user["_id"]),
        "business_name": application_data.get("business_name"),
        "business_type": application_data.get("business_type"),
        "category": application_data.get("category"),
        "description": application_data.get("description"),
        "address": application_data.get("address"),
        "phone": application_data.get("phone"),
        "tax_id": application_data.get("tax_id"),
        "status": "pending",
        "submitted_at": datetime.utcnow()
    }
    
    # Log the application data for debugging
    print(f"Creating seller application: {application}")
    
    result = db.seller_applications.insert_one(application)
    application_id = str(result.inserted_id)
    
    # Create notification for superadmin
    notification = {
        "user_id": None,  # For superadmin
        "type": "seller_application",
        "title": "New Seller Application",
        "message": f"User {current_user['username']} has applied to become a seller",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "application_id": application_id,
            "user_id": str(current_user["_id"])
        }
    }
    
    db.notifications.insert_one(notification)
    
    # Return created application
    application["_id"] = application_id
    application["user_id"] = str(application["user_id"])
    
    return application

@router.get("/my-application", response_model=Dict[str, Any])
async def get_my_application(current_user: dict = Depends(get_current_active_user)):
    # Find user's application
    application = db.seller_applications.find_one({
        "user_id": current_user["_id"]
    }, sort=[("submitted_at", -1)])
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found"
        )
    
    # Convert ObjectId to string
    application["_id"] = str(application["_id"])
    application["user_id"] = str(application["user_id"])
    
    return application

@router.get("/{application_id}", response_model=Dict[str, Any])
async def get_application_by_id(
    application_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin, superadmin, or the application owner can view
    application = db.seller_applications.find_one({"_id": ObjectId(application_id)})
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if (current_user["role"] not in ["admin", "superadmin"] and 
        application["user_id"] != current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application"
        )
    
    # Convert ObjectId to string
    application["_id"] = str(application["_id"])
    application["user_id"] = str(application["user_id"])
    
    # Get user details
    user = db.users.find_one({"_id": ObjectId(application["user_id"])})
    if user:
        user["_id"] = str(user["_id"])
        if "hashed_password" in user:
            del user["hashed_password"]
        application["user"] = user
    
    return application

@router.put("/{application_id}/status")
async def update_application_status(
  application_id: str,
  status_data: Dict[str, str],
  current_user: dict = Depends(get_current_active_user)
):
  # Only admin and superadmin can update application status
  if current_user["role"] not in ["admin", "superadmin"]:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not authorized to update application status"
      )
  
  new_status = status_data.get("status")
  if new_status not in ["approved", "rejected", "pending"]:
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="Invalid status"
      )
  
  # Get application
  application = db.seller_applications.find_one({"_id": ObjectId(application_id)})
  if not application:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="Application not found"
      )
  
  # Update application status
  db.seller_applications.update_one(
      {"_id": ObjectId(application_id)},
      {
          "$set": {
              "status": new_status,
              "updated_at": datetime.utcnow(),
              "updated_by": current_user["_id"],
              "reason": status_data.get("reason", "")
          }
      }
  )
  
  # If approved, update user role to seller
  if new_status == "approved":
      db.users.update_one(
          {"_id": ObjectId(application["user_id"])},
          {"$set": {"role": "seller"}}
      )
  
  # Create notification for the user
  notification = {
      "user_id": application["user_id"],
      "type": "application_status",
      "title": "Seller Application Update",
      "message": f"Your seller application has been {new_status}",
      "read": False,
      "created_at": datetime.utcnow(),
      "data": {
          "application_id": application_id,
          "status": new_status
      }
  }
  
  db.notifications.insert_one(notification)
  
  return {"message": f"Application status updated to {new_status}"}

# Add DELETE endpoint for seller applications
@router.delete("/{application_id}")
async def delete_seller_application(
    application_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin and superadmin can delete applications
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete applications"
        )
    
    # Check if application exists
    try:
        application = db.seller_applications.find_one({"_id": ObjectId(application_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Delete the application
    result = db.seller_applications.delete_one({"_id": ObjectId(application_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete application"
        )
    
    # Create notification for the user if user_id exists
    if "user_id" in application:
        notification = {
            "user_id": application["user_id"],
            "type": "application_deleted",
            "title": "Seller Application Deleted",
            "message": "Your seller application has been deleted by an administrator",
            "read": False,
            "created_at": datetime.utcnow(),
            "data": {
                "application_id": application_id
            }
        }
        
        db.notifications.insert_one(notification)
    
    return {"message": "Application deleted successfully"}

