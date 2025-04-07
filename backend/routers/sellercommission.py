# Updated backend code for sellercommission.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import MongoClient
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# Import user authentication
from .users import get_current_user

router = APIRouter()

# Default commission values (can be stored in a more persistent way, like a database)
DEFAULT_COMMISSION = 0.10
TOP_SELLER_COMMISSION_BONUS = 0.15  # This is now a bonus percentage added to the default

# Helper function to convert ObjectId to string
def serialize_seller_commission(commission):
    commission["_id"] = str(commission["_id"])
    return commission

@router.get("/", response_model=List[Dict[str, Any]])
async def get_seller_commissions(
    current_user: dict = Depends(get_current_user),
    month: Optional[int] = None,
    year: Optional[int] = None
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    # Get all sellers
    sellers = list(db.users.find({"role": "seller"}))
    
    # Create a dictionary to store order counts for each seller
    seller_order_counts = {}
    
    # Prepare seller commissions data
    seller_commissions = []
    for seller in sellers:
        seller_id = str(seller["_id"])
        seller = serialize_seller_commission(seller)
        
        # Build query for orders within the specified month and year
        order_query = {"items.seller_id": seller["_id"]}
        if month and year:
            try:
                start_date = datetime(year, month, 1)
                end_date = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
                order_query["created_at"] = {"$gte": start_date, "$lt": end_date}
                logger.info(f"Filtering orders for month={month}, year={year}, start_date={start_date}, end_date={end_date}")
            except ValueError as e:
                logger.error(f"Invalid month or year: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid month or year"
                )
        
        logger.info(f"Order query: {order_query}")
        
        # Get total orders and revenue for the seller
        total_orders = db.orders.count_documents(order_query)
        seller_order_counts[seller_id] = total_orders
        
        total_revenue = 0
        orders = list(db.orders.find(order_query))
        for order in orders:
            for item in order["items"]:
                if item.get("seller_id") == seller["_id"]:
                    total_revenue += item["price"] * item["quantity"]
        
        # Store basic commission data (we'll update is_top_seller and commission_percentage later)
        commission_data = {
            "_id": seller["_id"],
            "username": seller["username"],
            "email": seller["email"],
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "commission_status": "pending",  # Default status
            "commission_percentage": DEFAULT_COMMISSION,  # Default value, will be updated for top sellers
            "is_top_seller": False,  # Default value, will be updated
            "commission_amount": total_revenue * DEFAULT_COMMISSION  # Default value, will be updated
        }
        
        seller_commissions.append(commission_data)
    
    # Determine top 5 sellers based on order count
    top_seller_ids = []
    if seller_order_counts:
        # Sort sellers by order count and get top 5
        sorted_sellers = sorted(seller_order_counts.items(), key=lambda x: x[1], reverse=True)
        top_seller_ids = [seller_id for seller_id, _ in sorted_sellers[:5] if seller_order_counts[seller_id] > 0]
        
        logger.info(f"Top 5 sellers by order count: {top_seller_ids}")
    
    # Update commission data for top sellers
    for commission in seller_commissions:
        if commission["_id"] in top_seller_ids:
            commission["is_top_seller"] = True
            # Get the seller's custom commission percentage if it exists, otherwise use default + bonus
            seller = db.users.find_one({"_id": ObjectId(commission["_id"])})
            custom_percentage = seller.get("commission_percentage")
            
            if custom_percentage is not None:
                commission["commission_percentage"] = custom_percentage
            else:
                commission["commission_percentage"] = DEFAULT_COMMISSION + TOP_SELLER_COMMISSION_BONUS
            
            # Recalculate commission amount
            commission["commission_amount"] = commission["total_revenue"] * commission["commission_percentage"]
    
    return seller_commissions

@router.put("/{commission_id}/status")
async def update_commission_status(
    commission_id: str,
    status_data: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update commission status"
        )
    
    new_status = status_data.get("status")
    if new_status not in ["pending", "paid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    # Update commission status
    db.users.update_one(
        {"_id": ObjectId(commission_id)},
        {"$set": {"commission_status": new_status}}
    )
    
    return {"message": f"Commission status updated to {new_status}"}

@router.get("/default-values")
async def get_default_commission_values(current_user: dict = Depends(get_current_user)):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    return {
        "default_commission": DEFAULT_COMMISSION, 
        "top_seller_commission_bonus": TOP_SELLER_COMMISSION_BONUS
    }

@router.put("/default-values")
async def update_default_commission_values(
    commission_data: Dict[str, float],
    current_user: dict = Depends(get_current_user)
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update commission values"
        )
    
    global DEFAULT_COMMISSION, TOP_SELLER_COMMISSION_BONUS
    
    DEFAULT_COMMISSION = commission_data.get("default_commission", DEFAULT_COMMISSION)
    TOP_SELLER_COMMISSION_BONUS = commission_data.get("top_seller_commission_bonus", TOP_SELLER_COMMISSION_BONUS)
    
    return {"message": "Default commission values updated successfully"}

@router.put("/{commission_id}/percentage")
async def update_commission_percentage(
    commission_id: str,
    percentage_data: Dict[str, float],
    current_user: dict = Depends(get_current_user)
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update commission percentage"
        )
    
    new_percentage = percentage_data.get("commission_percentage")
    if new_percentage is None or new_percentage < 0 or new_percentage > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid commission percentage. Must be between 0 and 1."
        )
    
    try:
        # Update commission percentage for the seller
        result = db.users.update_one(
            {"_id": ObjectId(commission_id)},
            {"$set": {"commission_percentage": new_percentage}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller not found"
            )
        
        # Get seller information
        seller = db.users.find_one({"_id": ObjectId(commission_id)})
        
        # Get total revenue for the seller
        total_revenue = 0
        orders = list(db.orders.find({"items.seller_id": commission_id}))
        for order in orders:
            for item in order["items"]:
                if item.get("seller_id") == commission_id:
                    total_revenue += item["price"] * item["quantity"]
        
        # Calculate new commission amount
        commission_amount = total_revenue * new_percentage
        
        logger.info(f"Updated commission percentage for seller {commission_id} to {new_percentage}")
        
        return {
            "message": "Commission percentage updated successfully",
            "commission_percentage": new_percentage,
            "commission_amount": commission_amount
        }
    
    except Exception as e:
        logger.error(f"Error updating commission percentage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating commission percentage: {str(e)}"
        )