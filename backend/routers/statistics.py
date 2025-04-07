from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
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

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_statistics(
    current_user: dict = Depends(get_current_active_user),
    seller_id: Optional[str] = None
):
    # Check permissions
    if seller_id and current_user["role"] != "superadmin" and current_user["_id"] != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this seller's statistics"
        )
    
    # If no seller_id provided and user is a seller, use their ID
    if not seller_id and current_user["role"] == "seller":
        seller_id = current_user["_id"]
    
    # If user is superadmin and no seller_id provided, get platform-wide statistics
    is_platform_stats = current_user["role"] == "superadmin" and not seller_id
    
    # Calculate date ranges
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)
    this_month_start = today.replace(day=1)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    
    # Build base query
    base_query = {}
    if seller_id:
        base_query["seller_id"] = seller_id
    
    # Get product count
    product_count = db.products.count_documents(base_query)
    
    # Build order query
    order_base_query = {}
    if seller_id:
        order_base_query["items.seller_id"] = seller_id
    
    # Get order statistics
    today_orders_query = {**order_base_query, "created_at": {"$gte": today}}
    today_orders = db.orders.count_documents(today_orders_query)
    
    yesterday_orders_query = {**order_base_query, "created_at": {"$gte": yesterday, "$lt": today}}
    yesterday_orders = db.orders.count_documents(yesterday_orders_query)
    
    this_month_orders_query = {**order_base_query, "created_at": {"$gte": this_month_start}}
    this_month_orders = db.orders.count_documents(this_month_orders_query)
    
    last_month_orders_query = {**order_base_query, "created_at": {"$gte": last_month_start, "$lt": this_month_start}}
    last_month_orders = db.orders.count_documents(last_month_orders_query)
    
    # Get revenue statistics
    pipeline = [
        {"$match": {**order_base_query, "status": "completed"}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    pipeline.extend([
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "total_orders": {"$sum": 1}
            }
        }
    ])
    
    revenue_result = list(db.orders.aggregate(pipeline))
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    total_completed_orders = revenue_result[0]["total_orders"] if revenue_result else 0
    
    # Get today's revenue
    today_pipeline = [
        {"$match": {**order_base_query, "status": "completed", "created_at": {"$gte": today}}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        today_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    today_pipeline.extend([
        {
            "$group": {
                "_id": None,
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orders": {"$sum": 1}
            }
        }
    ])
    
    today_revenue_result = list(db.orders.aggregate(today_pipeline))
    today_revenue = today_revenue_result[0]["revenue"] if today_revenue_result else 0
    
    # Get yesterday's revenue
    yesterday_pipeline = [
        {"$match": {**order_base_query, "status": "completed", "created_at": {"$gte": yesterday, "$lt": today}}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        yesterday_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    yesterday_pipeline.extend([
        {
            "$group": {
                "_id": None,
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orders": {"$sum": 1}
            }
        }
    ])
    
    yesterday_revenue_result = list(db.orders.aggregate(yesterday_pipeline))
    yesterday_revenue = yesterday_revenue_result[0]["revenue"] if yesterday_revenue_result else 0
    
    # Get this month's revenue
    this_month_pipeline = [
        {"$match": {**order_base_query, "status": "completed", "created_at": {"$gte": this_month_start}}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        this_month_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    this_month_pipeline.extend([
        {
            "$group": {
                "_id": None,
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orders": {"$sum": 1}
            }
        }
    ])
    
    this_month_revenue_result = list(db.orders.aggregate(this_month_pipeline))
    this_month_revenue = this_month_revenue_result[0]["revenue"] if this_month_revenue_result else 0
    
    # Get last month's revenue
    last_month_pipeline = [
        {"$match": {**order_base_query, "status": "completed", "created_at": {"$gte": last_month_start, "$lt": this_month_start}}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        last_month_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    last_month_pipeline.extend([
        {
            "$group": {
                "_id": None,
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orders": {"$sum": 1}
            }
        }
    ])
    
    last_month_revenue_result = list(db.orders.aggregate(last_month_pipeline))
    last_month_revenue = last_month_revenue_result[0]["revenue"] if last_month_revenue_result else 0
    
    # Get customer count (for platform stats only)
    customer_count = 0
    if is_platform_stats:
        customer_count = db.users.count_documents({"role": "customer"})
    
    # Get seller count (for platform stats only)
    seller_count = 0
    if is_platform_stats:
        seller_count = db.users.count_documents({"role": "seller"})
    
    # Get pending seller applications (for platform stats only)
    pending_applications = 0
    if is_platform_stats:
        pending_applications = db.seller_applications.count_documents({"status": "pending"})
    
    # Get monthly revenue for the last 6 months
    monthly_pipeline = [
        {"$match": {**order_base_query, "status": "completed"}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        monthly_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    monthly_pipeline.extend([
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orders": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 6}
    ])
    
    monthly_revenue = list(db.orders.aggregate(monthly_pipeline))
    
    # Format monthly revenue
    monthly_data = []
    for month in monthly_revenue:
        year = month["_id"]["year"]
        month_num = month["_id"]["month"]
        month_name = datetime(year, month_num, 1).strftime("%b %Y")
        monthly_data.append({
            "month": month_name,
            "revenue": month["revenue"],
            "orders": month["orders"]
        })
    
    # Get top products
    top_products_pipeline = [
        {"$match": {**order_base_query, "status": "completed"}},
        {"$unwind": "$items"},
    ]
    
    if seller_id:
        top_products_pipeline.append({"$match": {"items.seller_id": seller_id}})
    
    top_products_pipeline.extend([
        {
            "$group": {
                "_id": "$items.product_id",
                "total_quantity": {"$sum": "$items.quantity"},
                "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
            }
        },
        {"$sort": {"total_revenue": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "_id",
                "as": "product"
            }
        },
        {"$unwind": "$product"},
        {
            "$project": {
                "product_id": {"$toString": "$_id"},
                "name": "$product.name",
                "category": "$product.category",
                "total_quantity": 1,
                "total_revenue": 1,
                "image_url": "$product.image_url"
            }
        }
    ])
    
    top_products = list(db.orders.aggregate(top_products_pipeline))
    
    # Save statistics to database for historical tracking
    stats_entry = {
        "date": today,
        "seller_id": seller_id if seller_id else "platform",
        "product_count": product_count,
        "today_orders": today_orders,
        "today_revenue": today_revenue,
        "this_month_orders": this_month_orders,
        "this_month_revenue": this_month_revenue,
        "total_revenue": total_revenue,
        "total_orders": total_completed_orders,
        "created_at": datetime.utcnow()
    }
    
    # Only insert if not already exists for today
    existing_stats = db.statistics.find_one({
        "date": today,
        "seller_id": seller_id if seller_id else "platform"
    })
    
    if not existing_stats:
        db.statistics.insert_one(stats_entry)
    else:
        db.statistics.update_one(
            {"_id": existing_stats["_id"]},
            {"$set": stats_entry}
        )
    
    return {
        "product_count": product_count,
        "orders": {
            "today": today_orders,
            "yesterday": yesterday_orders,
            "this_month": this_month_orders,
            "last_month": last_month_orders,
            "total": total_completed_orders,
            "change": {
                "daily": ((today_orders - yesterday_orders) / yesterday_orders * 100) if yesterday_orders > 0 else 0,
                "monthly": ((this_month_orders - last_month_orders) / last_month_orders * 100) if last_month_orders > 0 else 0
            }
        },
        "revenue": {
            "today": today_revenue,
            "yesterday": yesterday_revenue,
            "this_month": this_month_revenue,
            "last_month": last_month_revenue,
            "total": total_revenue,
            "change": {
                "daily": ((today_revenue - yesterday_revenue) / yesterday_revenue * 100) if yesterday_revenue > 0 else 0,
                "monthly": ((this_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0
            }
        },
        "monthly_data": monthly_data,
        "top_products": top_products,
        "platform_stats": {
            "customer_count": customer_count,
            "seller_count": seller_count,
            "pending_applications": pending_applications
        } if is_platform_stats else None
    }

@router.get("/history", response_model=List[Dict[str, Any]])
async def get_statistics_history(
    current_user: dict = Depends(get_current_active_user),
    seller_id: Optional[str] = None,
    days: int = 30
):
    # Check permissions
    if seller_id and current_user["role"] != "superadmin" and current_user["_id"] != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this seller's statistics"
        )
    
    # If no seller_id provided and user is a seller, use their ID
    if not seller_id and current_user["role"] == "seller":
        seller_id = current_user["_id"]
    
    # If user is superadmin and no seller_id provided, get platform-wide statistics
    if current_user["role"] == "superadmin" and not seller_id:
        seller_id = "platform"
    
    # Calculate date range
    end_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=days)
    
    # Get statistics
    stats = list(
        db.statistics.find({
            "seller_id": seller_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", 1)
    )
    
    # Convert ObjectId to string
    for stat in stats:
        stat["_id"] = str(stat["_id"])
        stat["date"] = stat["date"].strftime("%Y-%m-%d")
    
    return stats

