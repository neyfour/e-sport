from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import os

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# Import user authentication
from .users import get_current_user

router = APIRouter()

# Helper function to convert ObjectId to string
def serialize_product(product):
    product["_id"] = str(product["_id"])
    if "seller_id" in product and isinstance(product["seller_id"], ObjectId):
        product["seller_id"] = str(product["seller_id"])
    return product

@router.get("/all", response_model=List[Dict[str, Any]])
async def get_all_products(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc"
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    
    if category:
        query["category"] = category
    
    # Determine sort direction
    sort_direction = -1 if sort_order.lower() == "desc" else 1
    
    # Get products with pagination
    products_cursor = db.products.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    products = list(products_cursor)
    
    # Serialize products and add seller information
    serialized_products = []
    for product in products:
        product = serialize_product(product)
        
        # Get seller information
        seller_id = product.get("seller_id")
        if seller_id:
            seller = db.users.find_one({"_id": ObjectId(seller_id)})
            if seller:
                product["seller"] = {
                    "_id": str(seller["_id"]),
                    "username": seller.get("username", "Unknown"),
                    "email": seller.get("email", "")
                }
        
        serialized_products.append(product)
    
    return serialized_products

@router.get("/count", response_model=Dict[str, int])
async def get_products_count(
    current_user: dict = Depends(get_current_user),
    search: Optional[str] = None,
    category: Optional[str] = None
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    
    if category:
        query["category"] = category
    
    # Count products
    count = db.products.count_documents(query)
    
    return {"count": count}

@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product_details(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    # Get product
    try:
        product = db.products.find_one({"_id": ObjectId(product_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID format"
        )
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Serialize product
    product = serialize_product(product)
    
    # Get seller information
    seller_id = product.get("seller_id")
    if seller_id:
        seller = db.users.find_one({"_id": ObjectId(seller_id)})
        if seller:
            product["seller"] = {
                "_id": str(seller["_id"]),
                "username": seller.get("username", "Unknown"),
                "email": seller.get("email", "")
            }
    
    # Get product reviews
    reviews = list(db.reviews.find({"product_id": product_id}))
    product["reviews"] = [serialize_product(review) for review in reviews]
    
    # Get product statistics
    product["stats"] = {
        "views": db.product_views.count_documents({"product_id": product_id}),
        "orders": db.orders.count_documents({"items.product_id": product_id})
    }
    
    return product

@router.delete("/{product_id}", response_model=Dict[str, str])
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if user is superadmin
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete products"
        )
    
    # Check if product exists
    try:
        product = db.products.find_one({"_id": ObjectId(product_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID format"
        )
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get seller information for notification
    seller_id = product.get("seller_id")
    seller_username = "Unknown"
    if seller_id:
        seller = db.users.find_one({"_id": ObjectId(seller_id)})
        if seller:
            seller_username = seller.get("username", "Unknown")
    
    # Delete product
    db.products.delete_one({"_id": ObjectId(product_id)})
    
    # Delete related data
    db.reviews.delete_many({"product_id": product_id})
    db.product_views.delete_many({"product_id": product_id})
    
    # Create notification for seller
    if seller_id:
        notification = {
            "user_id": seller_id,
            "type": "product_deleted",
            "title": "Product Deleted",
            "message": f"Your product '{product.get('title', 'Unknown')}' has been deleted by an administrator",
            "read": False,
            "created_at": datetime.utcnow()
        }
        db.notifications.insert_one(notification)
    
    return {"message": f"Product '{product.get('title', 'Unknown')}' deleted successfully"}

