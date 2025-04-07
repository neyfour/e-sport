from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient

# Import from users.py
from .users import get_current_user, get_current_active_user

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()

@router.post("/process", response_model=Dict[str, Any])
async def process_payment(
    payment_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    order_id = payment_data.get("order_id")
    payment_method = payment_data.get("payment_method")
    payment_details = payment_data.get("payment_details", {})
    
    # Get order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns the order
    if order["user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order"
        )
    
    # Check if order is already paid
    if order.get("payment_status") == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already processed for this order"
        )
    
    # Process payment (in a real app, integrate with payment gateway)
    # For demo purposes, we'll simulate a successful payment
    payment = {
        "order_id": order_id,
        "user_id": current_user["_id"],
        "amount": order["total"],
        "payment_method": payment_method,
        "payment_details": payment_details,
        "status": "completed",  # completed, failed, refunded
        "transaction_id": f"txn_{datetime.utcnow().timestamp()}",
        "created_at": datetime.utcnow()
    }
    
    result = db.payments.insert_one(payment)
    payment_id = str(result.inserted_id)
    
    # Update order payment status
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "payment_status": "paid",
                "payment_id": payment_id,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create notifications for sellers
    seller_ids = set(item["seller_id"] for item in order.get("items", []) if "seller_id" in item)
    
    for seller_id in seller_ids:
        notification = {
            "user_id": seller_id,
            "type": "payment_received",
            "title": "Payment Received",
            "message": f"Payment received for order #{order_id}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        db.notifications.insert_one(notification)
    
    # Return payment details
    payment["_id"] = payment_id
    payment["order_id"] = str(payment["order_id"])
    payment["user_id"] = str(payment["user_id"])
    
    return payment

@router.get("/", response_model=List[Dict[str, Any]])
async def get_payments(
    current_user: dict = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 20
):
    # Build query based on user role
    query = {"user_id": current_user["_id"]}
    
    # Superadmin can see all payments
    if current_user["role"] == "superadmin":
        query = {}
    
    # Get payments
    payments = list(
        db.payments.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for payment in payments:
        payment["_id"] = str(payment["_id"])
        payment["order_id"] = str(payment["order_id"])
        payment["user_id"] = str(payment["user_id"])
    
    return payments

@router.get("/{payment_id}", response_model=Dict[str, Any])
async def get_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    payment = db.payments.find_one({"_id": ObjectId(payment_id)})
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if user has permission to view this payment
    is_owner = payment["user_id"] == current_user["_id"]
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_owner or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this payment"
        )
    
    # Convert ObjectId to string
    payment["_id"] = str(payment["_id"])
    payment["order_id"] = str(payment["order_id"])
    payment["user_id"] = str(payment["user_id"])
    
    return payment

