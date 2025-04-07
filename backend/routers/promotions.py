from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient

# Import from users.py
from .users import get_current_user, get_current_active_user

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
async def create_promotion(
    promotion_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Check if user is a seller or superadmin
    if current_user["role"] not in ["seller", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers and superadmins can create promotions"
        )
    
    # Validate promotion data
    code = promotion_data.get("code")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion code is required"
        )
    
    # Check if code already exists
    existing_promotion = db.promotions.find_one({"code": code})
    if existing_promotion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Promotion code '{code}' already exists"
        )
    
    # Create promotion
    promotion = {
        "code": code,
        "title": promotion_data.get("title"),
        "description": promotion_data.get("description"),
        "discount_type": promotion_data.get("discount_type", "percentage"),  # percentage, fixed
        "discount_value": promotion_data.get("discount_value", 0),
        "min_purchase": promotion_data.get("min_purchase", 0),
        "start_date": promotion_data.get("start_date", datetime.utcnow()),
        "end_date": promotion_data.get("end_date"),
        "product_ids": promotion_data.get("product_ids", []),
        "categories": promotion_data.get("categories", []),
        "usage_limit": promotion_data.get("usage_limit"),
        "usage_count": 0,
        "seller_id": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = db.promotions.insert_one(promotion)
    
    # Return created promotion
    promotion["_id"] = str(result.inserted_id)
    promotion["seller_id"] = str(promotion["seller_id"])
    
    return promotion

@router.get("/", response_model=List[Dict[str, Any]])
async def get_promotions(
    current_user: dict = Depends(get_current_active_user),
    active_only: bool = False,
    skip: int = 0,
    limit: int = 20
):
    # Build query based on user role
    query = {}
    
    if current_user["role"] == "seller":
        query["seller_id"] = current_user["_id"]
    # Superadmin can see all promotions (no additional filter)
    
    # Filter active promotions
    if active_only:
        now = datetime.utcnow()
        query["start_date"] = {"$lte": now}
        query["$or"] = [
            {"end_date": {"$gte": now}},
            {"end_date": None}
        ]
    
    # Get promotions
    promotions = list(
        db.promotions.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for promotion in promotions:
        promotion["_id"] = str(promotion["_id"])
        promotion["seller_id"] = str(promotion["seller_id"])
        
        # Convert product_ids to strings
        if "product_ids" in promotion:
            promotion["product_ids"] = [str(pid) for pid in promotion["product_ids"]]
    
    return promotions

@router.get("/{promotion_id}", response_model=Dict[str, Any])
async def get_promotion(
    promotion_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    promotion = db.promotions.find_one({"_id": ObjectId(promotion_id)})
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Check if user has permission to view this promotion
    is_owner = str(promotion["seller_id"]) == current_user["_id"]
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_owner or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this promotion"
        )
    
    # Convert ObjectId to string
    promotion["_id"] = str(promotion["_id"])
    promotion["seller_id"] = str(promotion["seller_id"])
    
    # Convert product_ids to strings
    if "product_ids" in promotion:
        promotion["product_ids"] = [str(pid) for pid in promotion["product_ids"]]
    
    return promotion

@router.put("/{promotion_id}", response_model=Dict[str, Any])
async def update_promotion(
    promotion_id: str,
    promotion_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    promotion = db.promotions.find_one({"_id": ObjectId(promotion_id)})
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Check if user has permission to update this promotion
    is_owner = str(promotion["seller_id"]) == current_user["_id"]
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_owner or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this promotion"
        )
    
    # Update promotion
    update_data = {k: v for k, v in promotion_data.items() if k != "_id" and k != "seller_id"}
    update_data["updated_at"] = datetime.utcnow()
    
    db.promotions.update_one(
        {"_id": ObjectId(promotion_id)},
        {"$set": update_data}
    )
    
    # Get updated promotion
    updated_promotion = db.promotions.find_one({"_id": ObjectId(promotion_id)})
    updated_promotion["_id"] = str(updated_promotion["_id"])
    updated_promotion["seller_id"] = str(updated_promotion["seller_id"])
    
    # Convert product_ids to strings
    if "product_ids" in updated_promotion:
        updated_promotion["product_ids"] = [str(pid) for pid in updated_promotion["product_ids"]]
    
    return updated_promotion

@router.delete("/{promotion_id}", response_model=Dict[str, str])
async def delete_promotion(
    promotion_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    promotion = db.promotions.find_one({"_id": ObjectId(promotion_id)})
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Check if user has permission to delete this promotion
    is_owner = str(promotion["seller_id"]) == current_user["_id"]
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_owner or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this promotion"
        )
    
    # Delete promotion
    db.promotions.delete_one({"_id": ObjectId(promotion_id)})
    
    return {"message": "Promotion deleted successfully"}

@router.post("/validate", response_model=Dict[str, Any])
async def validate_promotion_code(
    validation_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    code = validation_data.get("code")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion code is required"
        )
    
    # Get promotion by code
    promotion = db.promotions.find_one({"code": code})
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid promotion code"
        )
    
    # Check if promotion is active
    now = datetime.utcnow()
    start_date = promotion.get("start_date")
    end_date = promotion.get("end_date")
    
    if start_date and start_date > now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion not yet active"
        )
    
    if end_date and end_date < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion has expired"
        )
    
    # Check usage limit
    usage_limit = promotion.get("usage_limit")
    usage_count = promotion.get("usage_count", 0)
    
    if usage_limit and usage_count >= usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion usage limit reached"
        )
    
    # Check minimum purchase
    cart_total = validation_data.get("cart_total", 0)
    min_purchase = promotion.get("min_purchase", 0)
    
    if cart_total < min_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum purchase of ${min_purchase} required"
        )
    
    # Calculate discount
    discount_type = promotion.get("discount_type", "percentage")
    discount_value = promotion.get("discount_value", 0)
    
    if discount_type == "percentage":
        discount_amount = cart_total * (discount_value / 100)
    else:  # fixed
        discount_amount = discount_value
    
    # Return promotion details
    promotion["_id"] = str(promotion["_id"])
    promotion["seller_id"] = str(promotion["seller_id"])
    
    # Convert product_ids to strings
    if "product_ids" in promotion:
        promotion["product_ids"] = [str(pid) for pid in promotion["product_ids"]]
    
    return {
        "promotion": promotion,
        "discount_amount": discount_amount,
        "final_total": cart_total - discount_amount
    }

