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

@router.get("/", response_model=List[Dict[str, Any]])
async def get_orders(
    current_user: dict = Depends(get_current_active_user),
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    # Build query
    query = {}
    
    # Filter by user role
    if current_user["role"] == "customer":
        # Customers can only see their own orders
        query["user_id"] = current_user["_id"]
    elif current_user["role"] == "seller":
        # Sellers can see orders containing their products
        query["items.seller_id"] = current_user["_id"]
    # Superadmins can see all orders
    
    # Filter by status if provided
    if status:
        query["status"] = status
    
    # Get orders
    orders = list(
        db.orders.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for order in orders:
        order["_id"] = str(order["_id"])
        order["user_id"] = str(order["user_id"])
        
        # Get user details
        user = db.users.find_one({"_id": ObjectId(order["user_id"])})
        if user:
            order["user"] = {
                "_id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"]
            }
        
        # Process items
        for item in order["items"]:
            item["product_id"] = str(item["product_id"])
            item["seller_id"] = str(item["seller_id"])
            
            # Get product details
            product = db.products.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                item["product"] = {
                    "_id": str(product["_id"]),
                    "name": product["title"],
                    "image_url": product["image_url"]
                }
            
            # Get seller details
            seller = db.users.find_one({"_id": ObjectId(item["seller_id"])})
            if seller:
                item["seller"] = {
                    "_id": str(seller["_id"]),
                    "username": seller["username"],
                    "email": seller["email"]
                }
    
    return orders

@router.get("/count", response_model=Dict[str, int])
async def get_order_count(
    current_user: dict = Depends(get_current_active_user),
    status: Optional[str] = None
):
    # Build query
    query = {"user_id": current_user["_id"]}
    
    # For sellers, get orders that contain their products
    if current_user["role"] == "seller":
        query = {"items.seller_id": current_user["_id"]}
    
    # For admin/superadmin, they can see all orders
    if current_user["role"] in ["admin", "superadmin"]:
        query = {}
    
    if status:
        query["status"] = status
    
    # Count orders
    count = db.orders.count_documents(query)
    
    return {"count": count}

@router.get("/{order_id}", response_model=Dict[str, Any])
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Get order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to view this order
    is_owner = order["user_id"] == current_user["_id"]
    is_seller = any(item["seller_id"] == current_user["_id"] for item in order["items"])
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_owner or is_seller or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order"
        )
    
    # Convert ObjectId to string
    order["_id"] = str(order["_id"])
    order["user_id"] = str(order["user_id"])
    
    # Get user details
    user = db.users.find_one({"_id": ObjectId(order["user_id"])})
    if user:
        order["user"] = {
            "_id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        }
    
    # Process items
    for item in order["items"]:
        item["product_id"] = str(item["product_id"])
        item["seller_id"] = str(item["seller_id"])
        
        # Get product details
        product = db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            item["product"] = {
                "_id": str(product["_id"]),
                "name": product["title"],
                "image_url": product["image_url"]
            }
        
        # Get seller details
        seller = db.users.find_one({"_id": ObjectId(item["seller_id"])})
        if seller:
            item["seller"] = {
                "_id": str(seller["_id"]),
                "username": seller["username"],
                "email": seller["email"]
            }
    
    return order

@router.post("/", response_model=Dict[str, Any])
async def create_order(
    order_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Validate items
    if not order_data.get("items") or not isinstance(order_data["items"], list) or len(order_data["items"]) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )
    
    # Process items
    items = []
    total = 0
    
    for item in order_data["items"]:
        # Get product
        product = db.products.find_one({"_id": ObjectId(item["product_id"])})
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item['product_id']} not found"
            )
        
        # Check stock
        if product["stock"] < item["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product {product['name']}"
            )
        
        # Calculate price
        price = product["price"]
        if product.get("discount_percent", 0) > 0:
            price = price * (1 - product["discount_percent"] / 100)
        
        # Add item
        items.append({
            "product_id": str(product["_id"]),
            "seller_id": str(product["seller_id"]),
            "quantity": item["quantity"],
            "price": price,
            "product_name": product["title"],
            "product_image": product["image_url"]
        })
        
        # Update total
        total += price * item["quantity"]
        
        # Update stock
        db.products.update_one(
            {"_id": product["_id"]},
            {"$inc": {"stock": -item["quantity"], "sales_count": item["quantity"]}}
        )
    
    # Create order
    order = {
        "user_id": current_user["_id"],
        "items": items,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "created_at": datetime.utcnow(),
        "shipping_address": order_data.get("shipping_address"),
        "billing_address": order_data.get("billing_address") or order_data.get("shipping_address")
    }
    
    result = db.orders.insert_one(order)
    
    # Create notifications for sellers
    seller_ids = set(item["seller_id"] for item in items)
    
    for seller_id in seller_ids:
        notification = {
            "user_id": seller_id,
            "type": "new_order",
            "title": "New Order",
            "message": f"You have a new order from {current_user['username']}",
            "read": False,
            "created_at": datetime.utcnow(),
            "data": {
                "order_id": str(result.inserted_id)
            }
        }
        
        db.notifications.insert_one(notification)
    
    # Return created order
    order["_id"] = str(result.inserted_id)
    
    return order

@router.put("/{order_id}/status", response_model=Dict[str, Any])
async def update_order_status(
    order_id: str,
    status_data: Dict[str, str],
    current_user: dict = Depends(get_current_active_user)
):
    # Get order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to update this order
    is_seller = any(item["seller_id"] == current_user["_id"] for item in order["items"])
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_seller or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    # Validate status
    new_status = status_data.get("status")
    if not new_status or new_status not in ["pending", "processing", "shipped", "delivered", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    # Update order
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": new_status,
            "updated_at": datetime.utcnow(),
            "updated_by": current_user["_id"]
        }}
    )
    
    # Create notification for user
    notification = {
        "user_id": order["user_id"],
        "type": "order_status",
        "title": "Order Status Updated",
        "message": f"Your order #{order_id[-6:]} has been updated to {new_status}",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "order_id": order_id,
            "status": new_status
        }
    }
    
    db.notifications.insert_one(notification)
    
    # If cancelled, restore stock
    if new_status == "cancelled":
        for item in order["items"]:
            db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"], "sales_count": -item["quantity"]}}
            )
    
    # Return updated order
    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["_id"] = str(updated_order["_id"])
    updated_order["user_id"] = str(updated_order["user_id"])
    
    return updated_order

@router.put("/{order_id}/tracking", response_model=Dict[str, Any])
async def update_order_tracking(
    order_id: str,
    tracking_data: Dict[str, str],
    current_user: dict = Depends(get_current_active_user)
):
    # Get order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to update this order
    is_seller = any(item["seller_id"] == current_user["_id"] for item in order["items"])
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_seller or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    # Validate tracking number
    tracking_number = tracking_data.get("tracking_number")
    if not tracking_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tracking number is required"
        )
    
    # Update order
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "tracking_number": tracking_number,
            "carrier": tracking_data.get("carrier"),
            "updated_at": datetime.utcnow(),
            "updated_by": current_user["_id"]
        }}
    )
    
    # Create notification for user
    notification = {
        "user_id": order["user_id"],
        "type": "order_tracking",
        "title": "Tracking Information Added",
        "message": f"Tracking information has been added to your order #{order_id[-6:]}",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "order_id": order_id,
            "tracking_number": tracking_number,
            "carrier": tracking_data.get("carrier")
        }
    }
    
    db.notifications.insert_one(notification)
    
    # Return updated order
    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["_id"] = str(updated_order["_id"])
    updated_order["user_id"] = str(updated_order["user_id"])
    
    return updated_order

@router.post("/{order_id}/tracking-updates", response_model=Dict[str, Any])
async def add_tracking_update(
    order_id: str,
    update_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    # Get order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user has permission to update this order
    is_seller = any(item["seller_id"] == current_user["_id"] for item in order["items"])
    is_superadmin = current_user["role"] == "superadmin"
    
    if not (is_seller or is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    # Validate update data
    if not update_data.get("status") or not update_data.get("location"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status and location are required"
        )
    
    # Create tracking update
    tracking_update = {
        "status": update_data["status"],
        "location": update_data["location"],
        "description": update_data.get("description", ""),
        "timestamp": datetime.utcnow()
    }
    
    # Update order
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$push": {"tracking_updates": tracking_update},
            "$set": {
                "updated_at": datetime.utcnow(),
                "updated_by": current_user["_id"]
            }
        }
    )
    
    # Create notification for user
    notification = {
        "user_id": order["user_id"],
        "type": "order_tracking_update",
        "title": "Tracking Update",
        "message": f"New tracking update for your order #{order_id[-6:]}: {update_data['status']}",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "order_id": order_id,
            "tracking_update": tracking_update
        }
    }
    
    db.notifications.insert_one(notification)
    
    # Return updated order
    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["_id"] = str(updated_order["_id"])
    updated_order["user_id"] = str(updated_order["user_id"])
    
    return updated_order

@router.get("/track/{order_number}", response_model=Dict[str, Any])
async def track_order(order_number: str):
    # Get order by order number
    order = db.orders.find_one({"order_number": order_number})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Convert ObjectId to string
    order["_id"] = str(order["_id"])
    order["user_id"] = str(order["user_id"])
    
    # Convert seller_id in items
    for item in order.get("items", []):
        if "seller_id" in item:
            item["seller_id"] = str(item["seller_id"])
        if "product_id" in item:
            item["product_id"] = str(item["product_id"])
    
    # Get tracking history
    tracking_history = list(db.order_tracking.find({"order_id": order["_id"]}))
    
    # Convert ObjectId to string
    for entry in tracking_history:
        entry["_id"] = str(entry["_id"])
        entry["order_id"] = str(entry["order_id"])
    
    order["tracking_history"] = tracking_history
    
    return order

