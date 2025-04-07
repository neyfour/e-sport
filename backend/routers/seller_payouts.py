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

@router.post("/request", response_model=Dict[str, Any])
async def request_payout(
    payout_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Check if user is a seller
    if current_user["role"] != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can request payouts"
        )
    
    # Get amount to withdraw
    amount = payout_data.get("amount")
    if not amount or amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payout amount"
        )
    
    # Check if seller has enough balance
    seller = db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    
    current_balance = seller.get("balance", 0)
    if current_balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: {current_balance}"
        )
    
    # Create payout request
    payout_request = {
        "seller_id": current_user["_id"],
        "amount": amount,
        "payment_method": payout_data.get("payment_method"),
        "payment_details": payout_data.get("payment_details", {}),
        "status": "pending",  # pending, approved, rejected
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = db.payout_requests.insert_one(payout_request)
    
    # Reduce seller balance temporarily
    db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"balance": -amount}}
    )
    
    # Create notification for superadmin
    notification = {
        "user_id": None,  # For superadmin
        "type": "payout_request",
        "title": "New Payout Request",
        "message": f"Seller {current_user['username']} has requested a payout of ${amount}",
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    db.notifications.insert_one(notification)
    
    # Return payout request
    payout_request["_id"] = str(result.inserted_id)
    payout_request["seller_id"] = str(payout_request["seller_id"])
    
    return payout_request

@router.get("/", response_model=List[Dict[str, Any]])
async def get_payout_requests(
    current_user: dict = Depends(get_current_active_user),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    # Build query based on user role
    if current_user["role"] == "seller":
        query = {"seller_id": current_user["_id"]}
    elif current_user["role"] == "superadmin":
        query = {}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view payout requests"
        )
    
    if status:
        query["status"] = status
    
    # Get payout requests
    payout_requests = list(
        db.payout_requests.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for request in payout_requests:
        request["_id"] = str(request["_id"])
        request["seller_id"] = str(request["seller_id"])
        if "processed_by" in request:
            request["processed_by"] = str(request["processed_by"])
    
    return payout_requests

@router.put("/{request_id}/process", response_model=Dict[str, Any])
async def process_payout_request(
    request_id: str,
    process_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Only superadmin can process payouts
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can process payout requests"
        )
    
    # Get payout request
    payout_request = db.payout_requests.find_one({"_id": ObjectId(request_id)})
    if not payout_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout request not found"
        )
    
    # Check if already processed
    if payout_request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payout request already {payout_request['status']}"
        )
    
    # Get decision
    decision = process_data.get("status")
    if decision not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid decision. Must be 'approved' or 'rejected'"
        )
    
    # Process payout request
    update_data = {
        "status": decision,
        "processed_by": current_user["_id"],
        "processed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "notes": process_data.get("notes")
    }
    
    db.payout_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data}
    )
    
    # If rejected, return funds to seller
    if decision == "rejected":
        db.users.update_one(
            {"_id": ObjectId(payout_request["seller_id"])},
            {"$inc": {"balance": payout_request["amount"]}}
        )
    
    # Create notification for seller
    notification = {
        "user_id": payout_request["seller_id"],
        "type": "payout_processed",
        "title": "Payout Request Processed",
        "message": f"Your payout request for ${payout_request['amount']} has been {decision}",
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    db.notifications.insert_one(notification)
    
    # Get updated payout request
    updated_request = db.payout_requests.find_one({"_id": ObjectId(request_id)})
    updated_request["_id"] = str(updated_request["_id"])
    updated_request["seller_id"] = str(updated_request["seller_id"])
    updated_request["processed_by"] = str(updated_request["processed_by"])
    
    return updated_request

