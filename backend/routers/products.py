from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient

# Import from users.py
from .users import get_current_user

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def get_products(
    skip: int = 0,
    limit: int = 1000,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    min_rating: Optional[float] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    seller_id: Optional[str] = None
):
    # Build query
    query = {}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    price_query = {}
    if min_price is not None:
        price_query["$gte"] = min_price
    if max_price is not None:
        price_query["$lte"] = max_price
    
    if price_query:
        query["price"] = price_query
    
    if brand:
        query["brand"] = brand
    
    if in_stock:
        query["stock"] = {"$gt": 0}
    
    if min_rating is not None:
        query["rating"] = {"$gte": min_rating}
    
    if color:
        query["variants.color"] = color
    
    if size:
        query["variants.size"] = size
    
    # IMPORTANT FIX: Convert seller_id string to ObjectId
    if seller_id:
        try:
            query["seller_id"] = ObjectId(seller_id)
        except:
            # If conversion fails, try the original string (for backward compatibility)
            query["seller_id"] = seller_id
    
    # Get products
    products = list(
        db.products.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string
    for product in products:
        product["id"] = str(product.pop("_id"))
        if "seller_id" in product:
            product["seller_id"] = str(product["seller_id"])
    
    return products



@router.get("/categories", response_model=List[str])
async def get_product_categories():
    # Get unique categories from products
    categories = db.products.distinct("category")
    return categories

@router.post("/", response_model=Dict[str, Any])
async def create_product(
    product: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    # Only sellers and superadmin can create products
    if current_user["role"] not in ["seller", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create products"
        )
    
    # Create product
    new_product = {
        "title": product.get("title"),
        "description": product.get("description"),
        "price": product.get("price"),
        "category": product.get("category"),
        "image_url": product.get("image_url"),
        "stock": product.get("stock", 0),
        "seller_id": ObjectId(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "brand": product.get("brand"),
        "rating": product.get("rating", 0),
        "variants": product.get("variants", []),
        "discount_percent": product.get("discount_percent", 0),
        "tags": product.get("tags", [])
    }
    
    result = db.products.insert_one(new_product)
    
    # Return created product
    new_product["id"] = str(result.inserted_id)
    new_product.pop("_id", None)
    new_product["seller_id"] = str(new_product["seller_id"])
    
    return new_product

@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product(product_id: str):
    product = db.products.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Convert ObjectId to string
    product["id"] = str(product.pop("_id"))
    if "seller_id" in product:
        product["seller_id"] = str(product["seller_id"])
        
        # Get seller details
        seller = db.users.find_one({"_id": ObjectId(product["seller_id"])})
        if seller:
            product["seller"] = {
                "id": str(seller["_id"]),
                "username": seller["username"],
                "full_name": seller.get("full_name")
            }
    
    return product

@router.put("/{product_id}", response_model=Dict[str, Any])
async def update_product(
    product_id: str,
    product_update: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    # Get product
    product = db.products.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if user is the seller or superadmin
    if str(product["seller_id"]) != current_user["_id"] and current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this product"
        )
    
    # Update product
    product_update["updated_at"] = datetime.utcnow()
    
    db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_update}
    )
    
    # Get updated product
    updated_product = db.products.find_one({"_id": ObjectId(product_id)})
    
    # Convert ObjectId to string
    updated_product["id"] = str(updated_product.pop("_id"))
    updated_product["seller_id"] = str(updated_product["seller_id"])
    
    return updated_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Get product
    product = db.products.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if user is the seller or superadmin
    if str(product["seller_id"]) != current_user["_id"] and current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this product"
        )
    
    # Delete product
    db.products.delete_one({"_id": ObjectId(product_id)})
    
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/views")
async def increment_product_views(product_id: str):
    # Increment views count
    result = db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$inc": {"views_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return {"message": "Views count incremented"}

@router.post("/{product_id}/clicks")
async def increment_product_clicks(product_id: str):
    # Increment clicks count
    result = db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$inc": {"clicks_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return {"message": "Clicks count incremented"}

