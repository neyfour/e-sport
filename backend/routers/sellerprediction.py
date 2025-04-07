from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
import json
import os
import logging
from pymongo import MongoClient
from bson import ObjectId
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from dotenv import load_dotenv
import calendar
import math
import warnings
warnings.filterwarnings("ignore")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("seller_predictions")

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "ecommerce_db")

# Create router
router = APIRouter(
    prefix="/seller/predictions",
    tags=["seller_predictions"],
)

# Global MongoDB client to prevent connection issues
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]

# Helper function to handle NaN values in data
def clean_nan_values(obj):
    """Replace NaN values with 0 and convert numpy types to Python native types"""
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, (np.ndarray, pd.Series)):
        return clean_nan_values(obj.tolist())
    elif isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        if np.isnan(obj) or np.isinf(obj):
            # Instead of returning 0, return a small positive value
            return 0.01
        return float(obj)
    elif pd.isna(obj):
        return 0
    else:
        return obj

def parse_mongo_date(date_str):
    """Parse MongoDB date string to datetime object with timezone"""
    try:
        if isinstance(date_str, datetime):
            # If already a datetime, ensure it has timezone
            if date_str.tzinfo is None:
                return date_str.replace(tzinfo=timezone.utc)
            return date_str
            
        # Handle ISO format dates
        if isinstance(date_str, str):
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            dt = datetime.fromisoformat(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        
        # Fallback for other date formats
        return datetime.now(timezone.utc)
    except Exception as e:
        logger.warning(f"Could not parse date: {date_str}, error: {str(e)}")
        return datetime.now(timezone.utc)

# Helper functions
def get_date_range(period: str) -> tuple:
    """Get start and end dates based on period"""
    today = datetime.now(timezone.utc)
    end_date = datetime.combine(today.date(), datetime.max.time()).replace(tzinfo=timezone.utc)
    
    if period == "today":
        start_date = datetime.combine(today.date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    elif period == "week":
        start_date = datetime.combine((today - timedelta(days=today.weekday())).date(), 
                         datetime.min.time()).replace(tzinfo=timezone.utc)
    elif period == "month":
        start_date = datetime.combine(today.replace(day=1).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    elif period == "quarter":
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        start_date = datetime.combine(today.replace(month=quarter_start_month, day=1).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    elif period == "year":
        start_date = datetime.combine(today.replace(month=1, day=1).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    else:  # all time
        start_date = datetime(2000, 1, 1).replace(tzinfo=timezone.utc)
    
    return start_date, end_date

def format_currency(value: float) -> float:
    """Format currency value to 2 decimal places"""
    return round(value, 2)

def calculate_growth(current_value: float, previous_value: float) -> float:
    """Calculate growth percentage"""
    if previous_value == 0:
        return 100.0 if current_value > 0 else 0.0
    return round(((current_value - previous_value) / previous_value) * 100, 2)

def serialize_object_id(obj):
    """Convert ObjectId to string in a dictionary or list"""
    if isinstance(obj, dict):
        return {k: serialize_object_id(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_object_id(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

# Add these functions after the helper functions and before the prediction functions

async def get_historical_sales_data(
    seller_id: str,
    use_mock_data: bool = False,
    start_date: datetime = datetime(2024, 1, 1, tzinfo=timezone.utc),
    end_date: datetime = datetime(2025, 4, 1, tzinfo=timezone.utc)
):
    """Get historical sales data for a seller in a fixed date range"""
    try:
        logger.info(f"Getting historical sales data for seller {seller_id} from {start_date} to {end_date}")
        
        # Get seller overview to extract monthly data
        seller_overview = await get_seller_overview(seller_id, period="all")
        
        # Extract monthly data
        monthly_data = seller_overview.get("monthly_data", [])
        
        if not monthly_data and not use_mock_data:
            logger.warning(f"No monthly data found for seller {seller_id}")
            raise HTTPException(status_code=404, detail=f"No historical data found for seller {seller_id}")
        
        # Convert monthly data to DataFrame
        df_data = []
        
        for month_data in monthly_data:
            # Parse month string to datetime
            month_str = month_data.get("month", "")
            try:
                month_date = datetime.strptime(month_str, "%B %Y").replace(day=1, tzinfo=timezone.utc)
            except ValueError:
                logger.warning(f"Could not parse month string: {month_str}")
                continue
            
            # Only include data within the specified date range
            if start_date <= month_date <= end_date:
                df_data.append({
                    "month": month_date,
                    "revenue": month_data.get("revenue", 0),
                    "order_count": month_data.get("orders", 0),
                    "units_sold": month_data.get("orders", 0) * 1.5  # Estimate units sold based on orders
                })
        
        # Create DataFrame
        df = pd.DataFrame(df_data)
        
        # If no data or use_mock_data is True, generate mock data
        if (df.empty or use_mock_data) and use_mock_data:
            logger.info("Generating mock sales data")
            
            # Generate date range
            date_range = pd.date_range(start=start_date, end=end_date, freq='MS')
            
            # Generate mock data
            mock_data = []
            base_revenue = 5000
            base_orders = 50
            base_units = 75
            
            for i, date in enumerate(date_range):
                # Add some seasonality and trend
                season = 1.0 + 0.2 * np.sin(2 * np.pi * i / 12)  # Seasonal component
                trend = 1.0 + 0.05 * (i / 12)  # Trend component
                
                # Add some randomness
                random_factor = np.random.normal(1.0, 0.1)
                
                revenue = base_revenue * season * trend * random_factor
                orders = int(base_orders * season * trend * random_factor)
                units = int(base_units * season * trend * random_factor)
                
                mock_data.append({
                    "month": date.replace(tzinfo=timezone.utc),
                    "revenue": revenue,
                    "order_count": orders,
                    "units_sold": units
                })
            
            # Create DataFrame
            df = pd.DataFrame(mock_data)
        
        # Ensure we have the required columns
        if 'month' not in df.columns or 'revenue' not in df.columns:
            logger.error("Missing required columns in historical data")
            raise HTTPException(status_code=500, detail="Missing required columns in historical data")
        
        # Sort by month
        df = df.sort_values('month')
        
        # Fill missing values
        if 'order_count' not in df.columns:
            df['order_count'] = df['revenue'].apply(lambda x: max(1, int(x / 100)))
        
        if 'units_sold' not in df.columns:
            df['units_sold'] = df['order_count'] * 1.5
        
        logger.info(f"Retrieved {len(df)} months of historical sales data")
        return df
    
    except Exception as e:
        logger.error(f"Error getting historical sales data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting historical sales data: {str(e)}")

async def get_historical_product_data(
    seller_id: str,
    use_mock_data: bool = False,
    start_date: datetime = datetime(2024, 1, 1, tzinfo=timezone.utc),
    end_date: datetime = datetime(2025, 4, 1, tzinfo=timezone.utc)
):
    """Get historical product data for a seller in a fixed date range"""
    try:
        logger.info(f"Getting historical product data for seller {seller_id} from {start_date} to {end_date}")
        
        # Get seller overview to extract top products
        seller_overview = await get_seller_overview(seller_id, period="all")
        
        # Extract top products
        top_products = seller_overview.get("top_products", [])
        
        if not top_products and not use_mock_data:
            logger.warning(f"No top products found for seller {seller_id}")
            raise HTTPException(status_code=404, detail=f"No historical product data found for seller {seller_id}")
        
        # Get monthly data for date range
        monthly_data = []
        current_date = start_date
        while current_date <= end_date:
            monthly_data.append(current_date)
            # Move to next month
            year = current_date.year + ((current_date.month) // 12)
            month = (current_date.month % 12) + 1
            current_date = datetime(year, month, 1, tzinfo=timezone.utc)
        
        # Generate product data for each month
        df_data = []
        
        # If we have real products, use them
        if top_products and not use_mock_data:
            for product in top_products:
                product_id = product.get("product_id", "")
                product_name = product.get("name", "Unknown Product")
                product_category = product.get("category", "Uncategorized")
                product_image = product.get("image_url", "/placeholder.svg")
                
                # Estimate price from revenue and quantity
                total_revenue = float(product.get("total_revenue", 0))
                total_quantity = int(product.get("total_quantity", 1))
                product_price = product.get("price", 11)
                
                # Distribute revenue and units across months
                for month_date in monthly_data:
                    # Add some seasonality and randomness
                    month_num = month_date.month
                    season = 1.0 + 0.2 * np.sin(2 * np.pi * month_num / 12)
                    random_factor = np.random.normal(1.0, 0.1)
                    
                    # Calculate revenue and units for this month
                    month_revenue = (total_revenue / len(monthly_data)) * season * random_factor
                    month_units = max(1, int((total_quantity / len(monthly_data)) * season * random_factor))
                    
                    df_data.append({
                        "month": month_date,
                        "product_id": product_id,
                        "product_name": product_name,
                        "product_category": product_category,
                        "product_image": product_image,
                        "product_price": product_price,
                        "revenue": month_revenue,
                        "units_sold": month_units
                    })
        
        # If no data or use_mock_data is True, generate mock data
        if (not df_data or use_mock_data) and use_mock_data:
            logger.info("Generating mock product data")
            
            # Generate mock products
            mock_products = []
            for i in range(10):
                product_id = f"product_{i+1}"
                product_name = f"Product {i+1}"
                product_category = ["Electronics", "Clothing", "Home", "Beauty", "Sports"][i % 5]
                product_image = f"/placeholder.svg?text=Product{i+1}"
                product_price = np.random.uniform(10, 200)
                
                mock_products.append({
                    "product_id": product_id,
                    "product_name": product_name,
                    "product_category": product_category,
                    "product_image": product_image,
                    "product_price": product_price
                })
            
            # Generate data for each product and month
            for product in mock_products:
                base_revenue = np.random.uniform(500, 5000)
                base_units = np.random.uniform(5, 50)
                
                for i, month_date in enumerate(monthly_data):
                    # Add some seasonality and trend
                    month_num = month_date.month
                    season = 1.0 + 0.2 * np.sin(2 * np.pi * month_num / 12)
                    trend = 1.0 + 0.05 * (i / 12)
                    random_factor = np.random.normal(1.0, 0.1)
                    
                    # Calculate revenue and units for this month
                    month_revenue = base_revenue * season * trend * random_factor
                    month_units = max(1, int(base_units * season * trend * random_factor))
                    
                    df_data.append({
                        "month": month_date,
                        "product_id": product["product_id"],
                        "product_name": product["product_name"],
                        "product_category": product["product_category"],
                        "product_image": product["product_image"],
                        "product_price": product["product_price"],
                        "revenue": month_revenue,
                        "units_sold": month_units
                    })
        
        # Create DataFrame
        df = pd.DataFrame(df_data)
        
        # Ensure we have the required columns
        required_columns = ['month', 'product_id', 'product_name', 'revenue', 'units_sold']
        for col in required_columns:
            if col not in df.columns:
                logger.error(f"Missing required column {col} in historical product data")
                raise HTTPException(status_code=500, detail=f"Missing required column {col} in historical product data")
        
        # Sort by month and product_id
        df = df.sort_values(['month', 'product_id'])
        
        logger.info(f"Retrieved historical product data for {df['product_id'].nunique()} products across {df['month'].nunique()} months")
        return df
    
    except Exception as e:
        logger.error(f"Error getting historical product data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting historical product data: {str(e)}")

async def get_product_statistics(seller_id: str):
    """Get product statistics for a seller"""
    try:
        logger.info(f"Getting product statistics for seller {seller_id}")
        
        # Get all products for this seller
        products = []
        
        # Try as string
        products = list(db.products.find({"seller_id": seller_id}))
        
        # Try as ObjectId if no products found and valid ObjectId
        if not products and ObjectId.is_valid(seller_id):
            products = list(db.products.find({"seller_id": ObjectId(seller_id)}))
        
        # Get all orders that have items with this seller_id
        all_orders = []
        
        # Try to find orders with items.seller_id matching the seller_id
        if ObjectId.is_valid(seller_id):
            all_orders = list(db.orders.find({
                "$or": [
                    {"items.seller_id": seller_id},
                    {"items.seller_id": ObjectId(seller_id)}
                ]
            }))
        else:
            all_orders = list(db.orders.find({"items.seller_id": seller_id}))
        
        # If no orders found, try other approaches
        if not all_orders:
            # Try seller_id directly on the order
            if ObjectId.is_valid(seller_id):
                all_orders = list(db.orders.find({
                    "$or": [
                        {"seller_id": seller_id},
                        {"seller_id": ObjectId(seller_id)}
                    ]
                }))
            else:
                all_orders = list(db.orders.find({"seller_id": seller_id}))
            
            # If still no orders, try user_id
            if not all_orders:
                if ObjectId.is_valid(seller_id):
                    all_orders = list(db.orders.find({
                        "$or": [
                            {"user_id": seller_id},
                            {"user_id": ObjectId(seller_id)}
                        ]
                    }))
                else:
                    all_orders = list(db.orders.find({"user_id": seller_id}))
        
        # Calculate product statistics
        product_stats = {}
        
        for order in all_orders:
            if "items" in order:
                for item in order["items"]:
                    if "product_id" in item:
                        product_id = str(item["product_id"])
                        
                        # Initialize product stats if not exists
                        if product_id not in product_stats:
                            product_stats[product_id] = {
                                "total_revenue": 0,
                                "total_units": 0,
                                "order_count": 0
                            }
                        
                        # Update product stats
                        product_stats[product_id]["order_count"] += 1
                        
                        # Update units
                        if "quantity" in item:
                            try:
                                quantity = int(item["quantity"]) if isinstance(item["quantity"], str) else item["quantity"]
                                product_stats[product_id]["total_units"] += quantity
                            except (ValueError, TypeError):
                                product_stats[product_id]["total_units"] += 1
                        else:
                            product_stats[product_id]["total_units"] += 1
                        
                        # Update revenue
                        if "price" in item and "quantity" in item:
                            try:
                                price = float(item["price"]) if isinstance(item["price"], str) else item["price"]
                                quantity = int(item["quantity"]) if isinstance(item["quantity"], str) else item["quantity"]
                                product_stats[product_id]["total_revenue"] += price * quantity
                            except (ValueError, TypeError):
                                pass
        
        # Add product details to stats
        for product in products:
            product_id = str(product["_id"])
            
            if product_id in product_stats:
                product_stats[product_id]["name"] = product.get("title", product.get("name", "Unknown Product"))
                product_stats[product_id]["category"] = product.get("category", "Uncategorized")
                product_stats[product_id]["image_url"] = product.get("image_url", "/placeholder.svg")
                
                # Calculate price
                if product_stats[product_id]["total_units"] > 0:
                    product_stats[product_id]["price"] = product_stats[product_id]["total_revenue"] / product_stats[product_id]["total_units"]
                else:
                    product_stats[product_id]["price"] = product.get("price", 0)
        
        return product_stats
    
    except Exception as e:
        logger.error(f"Error getting product statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting product statistics: {str(e)}")

# Helper function to get seller overview statistics
async def get_seller_overview(
    seller_id: str,
    period: str = "month"
):
    """Get seller overview statistics directly calculated from database"""
    try:
        logger.info(f"Getting overview for seller_id: {seller_id}, period: {period}")
        
        # Get date ranges
        start_date, end_date = get_date_range(period)
        logger.info(f"Date range: {start_date} to {end_date}")
        
        # Get previous period for comparison
        prev_start_date, prev_end_date = get_date_range(period)  # Will be adjusted below
        time_diff = end_date - start_date
        prev_start_date = start_date - time_diff
        prev_end_date = start_date - timedelta(days=1)
        
        # Get product count for this seller
        product_count = 0
        
        # Try as string
        product_count = db.products.count_documents({"seller_id": seller_id})
        
        # Try as ObjectId if no products found and valid ObjectId
        if product_count == 0 and ObjectId.is_valid(seller_id):
            product_count = db.products.count_documents({"seller_id": ObjectId(seller_id)})
        
        logger.info(f"Product count: {product_count}")
        
        # Get all products for this seller
        products = []
        
        # Try as string
        products = list(db.products.find({"seller_id": seller_id}))
        
        # Try as ObjectId if no products found and valid ObjectId
        if not products and ObjectId.is_valid(seller_id):
            products = list(db.products.find({"seller_id": ObjectId(seller_id)}))
        
        # Create a product lookup dictionary for quick access
        product_lookup = {}
        for product in products:
            product_lookup[str(product["_id"])] = product
        
        # Get all orders that have items with this seller_id
        all_orders = []
        
        # Try to find orders with items.seller_id matching the seller_id
        if ObjectId.is_valid(seller_id):
            all_orders = list(db.orders.find({
                "$or": [
                    {"items.seller_id": seller_id},
                    {"items.seller_id": ObjectId(seller_id)}
                ]
            }))
        else:
            all_orders = list(db.orders.find({"items.seller_id": seller_id}))
        
        # If no orders found, try other approaches
        if not all_orders:
            # Try seller_id directly on the order
            if ObjectId.is_valid(seller_id):
                all_orders = list(db.orders.find({
                    "$or": [
                        {"seller_id": seller_id},
                        {"seller_id": ObjectId(seller_id)}
                    ]
                }))
            else:
                all_orders = list(db.orders.find({"seller_id": seller_id}))
            
            # If still no orders, try user_id
            if not all_orders:
                if ObjectId.is_valid(seller_id):
                    all_orders = list(db.orders.find({
                        "$or": [
                            {"user_id": seller_id},
                            {"user_id": ObjectId(seller_id)}
                        ]
                    }))
                else:
                    all_orders = list(db.orders.find({"user_id": seller_id}))
        
        # Process each order to ensure dates are properly parsed
       # In the orders processing section, ensure proper date handling
        for order in all_orders:
         if "created_at" in order:
           if isinstance(order["created_at"], str):
            order["created_at"] = parse_mongo_date(order["created_at"])
           elif isinstance(order["created_at"], datetime):
            if order["created_at"].tzinfo is None:
                order["created_at"] = order["created_at"].replace(tzinfo=timezone.utc)
        
        # Filter out orders with invalid dates
        all_orders = [order for order in all_orders if "created_at" in order and order["created_at"] is not None]
        
        # Calculate total orders count
        total_orders_count = len(all_orders)
        logger.info(f"Total orders count: {total_orders_count}")
        
        # Calculate total revenue and cost from all orders
        total_revenue = 0
        total_cost = 0
        
        for order in all_orders:
            # Calculate revenue
            if "total" in order:
                try:
                    if isinstance(order["total"], (int, float)):
                        total_revenue += order["total"]
                    else:
                        total_revenue += float(order["total"])
                except (ValueError, TypeError):
                    pass
            
            # Calculate cost
            if "items" in order:
                for item in order["items"]:
                    item_cost = 0
                    
                    # Try to get cost directly from the item
                    if "cost" in item:
                        try:
                            if isinstance(item["cost"], (int, float)):
                                item_cost = item["cost"]
                            else:
                                item_cost = float(item["cost"])
                        except (ValueError, TypeError):
                            item_cost = 0
                    
                    # If no cost in item, try to get from product
                    if item_cost == 0 and "product_id" in item:
                        product_id = str(item["product_id"])
                        if product_id in product_lookup:
                            product = product_lookup[product_id]
                            if "cost" in product:
                                try:
                                    if isinstance(product["cost"], (int, float)):
                                        item_cost = product["cost"]
                                    else:
                                        item_cost = float(product["cost"])
                                except (ValueError, TypeError):
                                    item_cost = 0
                            # If no direct cost field, try cost_price or wholesale_price
                            elif "cost_price" in product:
                                try:
                                    if isinstance(product["cost_price"], (int, float)):
                                        item_cost = product["cost_price"]
                                    else:
                                        item_cost = float(product["cost_price"])
                                except (ValueError, TypeError):
                                    item_cost = 0
                            elif "wholesale_price" in product:
                                try:
                                    if isinstance(product["wholesale_price"], (int, float)):
                                        item_cost = product["wholesale_price"]
                                    else:
                                        item_cost = float(product["wholesale_price"])
                                except (ValueError, TypeError):
                                    item_cost = 0
                    
                    # If we have a cost and quantity, add to total cost
                    if item_cost > 0 and "quantity" in item:
                        try:
                            quantity = item["quantity"]
                            if isinstance(quantity, str):
                                quantity = int(quantity)
                            total_cost += item_cost * quantity
                        except (ValueError, TypeError):
                            # If quantity conversion fails, assume quantity of 1
                            total_cost += item_cost
                    elif item_cost > 0:
                        # If no quantity, assume quantity of 1
                        total_cost += item_cost
        
        logger.info(f"Total revenue: {total_revenue}")
        logger.info(f"Total cost: {total_cost}")
        
        # Calculate profit margin
        profit_margin = 0
        if total_revenue > 0:
            profit = total_revenue - total_cost
            profit_margin = round((profit / total_revenue) * 100, 2)
            logger.info(f"Calculated profit margin: {profit_margin}%")
        else:
            # Default fallback if no revenue data
            profit_margin = 30
            logger.info(f"Using default profit margin: {profit_margin}%")
        
        # Get current period orders
        current_period_orders = []
        for order in all_orders:
            if "created_at" in order:
                order_date = order["created_at"]
                if start_date <= order_date <= end_date:
                    current_period_orders.append(order)
        
        # Calculate current period revenue
        current_period_revenue = 0
        for order in current_period_orders:
            if "total" in order:
                try:
                    if isinstance(order["total"], (int, float)):
                        current_period_revenue += order["total"]
                    else:
                        current_period_revenue += float(order["total"])
                except (ValueError, TypeError):
                    pass
        
        logger.info(f"Current period revenue: {current_period_revenue}")
        
        # Get previous period orders
        previous_period_orders = []
        for order in all_orders:
            if "created_at" in order:
                order_date = order["created_at"]
                if prev_start_date <= order_date <= prev_end_date:
                    previous_period_orders.append(order)
        
        # Calculate previous period revenue
        previous_period_revenue = 0
        for order in previous_period_orders:
            if "total" in order:
                try:
                    if isinstance(order["total"], (int, float)):
                        previous_period_revenue += order["total"]
                    else:
                        previous_period_revenue += float(order["total"])
                except (ValueError, TypeError):
                    pass
        
        logger.info(f"Previous period revenue: {previous_period_revenue}")
        
        # Get today's orders
        today_start = datetime.combine(datetime.now(timezone.utc).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
        today_orders = []
        for order in all_orders:
            if "created_at" in order:
                order_date = order["created_at"]
                if today_start <= order_date:
                    today_orders.append(order)
        
        # Calculate today's revenue
        today_revenue = 0
        for order in today_orders:
            if "total" in order:
                try:
                    if isinstance(order["total"], (int, float)):
                        today_revenue += order["total"]
                    else:
                        today_revenue += float(order["total"])
                except (ValueError, TypeError):
                    pass
        
        logger.info(f"Today's revenue: {today_revenue}")
        
        # Get this month's orders
        month_start = datetime.combine(datetime.now(timezone.utc).replace(day=1).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
        logger.info(f"Month start date: {month_start}")
        
        month_orders = []
        for order in all_orders:
            if "created_at" in order:
                order_date = order["created_at"]
                if month_start <= order_date:
                    month_orders.append(order)
        
        # Calculate month revenue
        month_revenue = 0
        for order in month_orders:
            if "total" in order:
                try:
                    if isinstance(order["total"], (int, float)):
                        month_revenue += order["total"]
                    else:
                        month_revenue += float(order["total"])
                except (ValueError, TypeError):
                    pass
        
        logger.info(f"This month's orders count: {len(month_orders)}")
        logger.info(f"This month's revenue: {month_revenue}")
        
        # Calculate status distribution
        status_distribution = {}
        for order in all_orders:
            status = order.get("status", "pending")
            status_distribution[status] = status_distribution.get(status, 0) + 1
        
        logger.info(f"Status distribution: {status_distribution}")
        
        # Get monthly data for the past 12 months
        monthly_data = []
        today = datetime.now(timezone.utc)
        
        for i in range(12):
            month_offset = (today.month - i - 1) % 12 + 1
            year_offset = today.year - ((today.month - i - 1) // 12)
            
            first_day = datetime(year_offset, month_offset, 1, tzinfo=timezone.utc)
            if month_offset == 12:
                last_day = datetime(year_offset + 1, 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
            else:
                last_day = datetime(year_offset, month_offset + 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
            
            month_start_date = datetime.combine(first_day, datetime.min.time()).replace(tzinfo=timezone.utc)
            month_end_date = datetime.combine(last_day, datetime.max.time()).replace(tzinfo=timezone.utc)
            
            # Get orders for this month
            month_orders = []
            for order in all_orders:
                if "created_at" in order:
                    order_date = order["created_at"]
                    if month_start_date <= order_date <= month_end_date:
                        month_orders.append(order)
            
            # Calculate revenue for this month
            month_revenue = 0
            for order in month_orders:
                if "total" in order:
                    try:
                        if isinstance(order["total"], (int, float)):
                            month_revenue += order["total"]
                        else:
                            month_revenue += float(order["total"])
                    except (ValueError, TypeError):
                        pass
            
            month_name = calendar.month_name[month_offset]
            
            monthly_data.append({
                "month": f"{month_name} {year_offset}",
                "revenue": month_revenue,
                "orders": len(month_orders)
            })
        
        monthly_data.reverse()
        logger.info(f"Monthly data: {monthly_data[:2]}...")
        
        # Get daily sales for last 7 days
        daily_sales = []
        today_date = datetime.now(timezone.utc).date()
        
        for i in range(7):
            day = today_date - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = datetime.combine(day, datetime.max.time()).replace(tzinfo=timezone.utc)
            
            # Get orders for this day
            day_orders = []
            for order in all_orders:
                if "created_at" in order:
                    order_date = order["created_at"]
                    if day_start <= order_date <= day_end:
                        day_orders.append(order)
            
            # Calculate revenue for this day
            day_revenue = 0
            for order in day_orders:
                if "total" in order:
                    try:
                        if isinstance(order["total"], (int, float)):
                            day_revenue += order["total"]
                        else:
                            day_revenue += float(order["total"])
                    except (ValueError, TypeError):
                          pass
            
            day_name = day.strftime("%a")
            
            daily_sales.append({
                "name": day_name,
                "sales": day_revenue
            })
        
        daily_sales.reverse()
        logger.info(f"Daily sales: {daily_sales}")
        
        # Calculate revenue growth
        revenue_growth = calculate_growth(current_period_revenue, previous_period_revenue)
        logger.info(f"Revenue growth: {revenue_growth}%")
        
        # Prepare performance trend
        performance_trend = [
            {"name": "Sales", "value": min(100, (total_revenue / 10000) * 100) if total_revenue > 0 else 0},
            {"name": "Growth", "value": max(0, revenue_growth)},
            {"name": "Satisfaction", "value": 85},
            {"name": "Efficiency", "value": 70}
        ]
        
        # Get top products
        top_products = []
        for product in products[:5]:
            product_id = str(product["_id"])
            product_revenue = 0
            product_orders = 0
            
            for order in all_orders:
                if "items" in order:
                    for item in order["items"]:
                        if "product_id" in item and str(item["product_id"]) == product_id:
                            product_orders += 1
                            if "price" in item and "quantity" in item:
                                try:
                                    price = float(item["price"]) if isinstance(item["price"], str) else item["price"]
                                    quantity = int(item["quantity"]) if isinstance(item["quantity"], str) else item["quantity"]
                                    product_revenue += price * quantity
                                except (ValueError, TypeError):
                                    pass
            
            # Add product to top products
            top_products.append({
                "product_id": product_id,
                "name": product.get("title", product.get("name", "Unknown Product")),
                "category": product.get("category", "Uncategorized"),
                "total_quantity": product_orders,  # Or calculate actual quantity if available
                "total_revenue": format_currency(product_revenue),
                "order_count": product_orders,
                "image_url": product.get("image_url", "/placeholder.svg")
            })
        
        # Get category distribution
        category_distribution = {}
        for product in products:
            category = product.get("category", "Uncategorized")
            category_distribution[category] = category_distribution.get(category, 0) + 1
        
        # Prepare response
        response = {
            "product_count": product_count,
            "orders": {
                "total": total_orders_count,
                "today": len(today_orders),
                "this_month": len(month_orders),
                "by_status": status_distribution
            },
            "revenue": {
                "total": format_currency(total_revenue),
                "today": format_currency(today_revenue),
                "this_month": format_currency(month_revenue),
                "growth": revenue_growth
            },
            "monthly_data": monthly_data,
            "top_products": top_products,
            "daily_sales": daily_sales,
            "category_distribution": category_distribution,
            "performance_trend": performance_trend,
            "profit_margin": profit_margin,
            "data_source": "real",
            "debug_info": {
                "seller_id": seller_id,
                "all_orders_count": len(all_orders),
                "month_revenue": month_revenue,
                "total_cost": total_cost,
                "profit_calculation": f"{total_revenue} - {total_cost} = {total_revenue - total_cost}"
            }
        }
        
        return response
    
    except Exception as e:
        logger.error(f"Unexpected error in get_seller_overview: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving seller overview: {str(e)}")

# Function to generate 6-month forecast using ARIMA instead of Prophet
def generate_prophet_forecast(historical_data: pd.DataFrame, periods: int = 6):
    """Generate 6-month forecast using ARIMA with uncertainty intervals"""
    try:
        logger.info(f"Generating {periods}-month ARIMA forecast based on {len(historical_data)} months of historical data")
        
        # Check if historical data is empty or doesn't have required columns
        if historical_data.empty:
            logger.error("Historical data is empty")
            raise HTTPException(status_code=404, detail="No historical data available for forecasting")
        
        # Ensure we have the revenue column
        if 'revenue' not in historical_data.columns:
            logger.error("Revenue column not found in historical data")
            raise HTTPException(status_code=500, detail="Revenue data not available for forecasting")
        
        # Sort by month
        historical_data = historical_data.sort_values('month')
        
        # Extract revenue series
        revenue_series = historical_data.set_index('month')['revenue']
        
        # Fit ARIMA model
        # Using (1,1,1) as default parameters, which often work well for economic time series
        model = ARIMA(revenue_series, order=(1, 1, 1))
        results = model.fit()
        
        # Generate forecast
        forecast = results.forecast(steps=periods)
        forecast_index = pd.date_range(start=historical_data['month'].max() + pd.DateOffset(months=1), periods=periods, freq='MS')
        
        # Calculate prediction intervals (90% confidence)
        pred_intervals = results.get_forecast(steps=periods).conf_int(alpha=0.1)
        
        # Create forecast dataframe
        forecast_df = pd.DataFrame({
            'month': forecast_index,
            'revenue': forecast,
            'lower_bound': pred_intervals.iloc[:, 0],
            'upper_bound': pred_intervals.iloc[:, 1]
        })
        
        # Ensure no negative values
        forecast_df['revenue'] = forecast_df['revenue'].clip(lower=0)
        forecast_df['lower_bound'] = forecast_df['lower_bound'].clip(lower=0)
        forecast_df['upper_bound'] = forecast_df['upper_bound'].clip(lower=0)
        
        # Ensure no extremely low values (floor at 10% of mean historical revenue)
        min_revenue = historical_data['revenue'].mean() * 0.1
        forecast_df['revenue'] = forecast_df['revenue'].clip(lower=min_revenue)
        
        # Check for and fix anomalous drops
        mean_forecast = forecast_df['revenue'].mean()
        for i in range(len(forecast_df)):
            # If any month is less than 25% of the mean forecast, adjust it
            if forecast_df.iloc[i]['revenue'] < mean_forecast * 0.25:
                forecast_df.loc[forecast_df.index[i], 'revenue'] = mean_forecast * 0.5
                forecast_df.loc[forecast_df.index[i], 'lower_bound'] = mean_forecast * 0.3
                forecast_df.loc[forecast_df.index[i], 'upper_bound'] = mean_forecast * 0.7
        
        # Add confidence level
        forecast_df['confidence_level'] = 90
        
        # Add forecast method
        forecast_df['method'] = 'ARIMA'
        
        # Check if more than 50% of historical months are $0
        zero_months_percentage = (historical_data['revenue'] == 0).mean() * 100
        if zero_months_percentage > 50:
            forecast_df['confidence_label'] = 'Low Confidence'
        else:
            forecast_df['confidence_label'] = 'Normal Confidence'
        
        logger.info(f"Successfully generated {periods}-month ARIMA forecast")
        return forecast_df
        
    except Exception as e:
        logger.error(f"ARIMA prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ARIMA prediction error: {str(e)}")

# Function to generate 1-year forecast using ARIMA
def generate_arima_forecast(historical_data: pd.DataFrame, periods: int = 12):
    """Generate 1-year forecast using ARIMA with seasonal components"""
    try:
        logger.info(f"Generating {periods}-month ARIMA forecast based on {len(historical_data)} months of historical data")
        
        # Check if historical data is empty or doesn't have required columns
        if historical_data.empty:
            logger.error("Historical data is empty")
            raise HTTPException(status_code=404, detail="No historical data available for forecasting")
        
        # Ensure we have the revenue column
        if 'revenue' not in historical_data.columns:
            logger.error("Revenue column not found in historical data")
            raise HTTPException(status_code=500, detail="Revenue data not available for forecasting")
        
        # Sort by month
        historical_data = historical_data.sort_values('month')
        
        # Extract revenue series
        revenue_series = historical_data.set_index('month')['revenue']
        
        # Check if we have enough data for ARIMA
        if len(revenue_series) < 12:
            logger.warning(f"Not enough data for ARIMA (need at least 12 months, have {len(revenue_series)})")
            # Fall back to simpler model if not enough data
            model = ARIMA(revenue_series, order=(1, 1, 1))
        else:
            # Use ARIMA model with seasonal component
            model = ARIMA(revenue_series, order=(1, 1, 1))
        
        # Fit the model
        results = model.fit()
        
        # Generate forecast
        forecast = results.forecast(steps=periods)
        
        # Create forecast dates
        last_date = historical_data['month'].max()
        forecast_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')
        
        # Ensure forecast doesn't go beyond April 2026 (constraint)
        end_constraint = datetime(2026, 4, 30, tzinfo=timezone.utc)
        valid_dates = [date for date in forecast_dates if date <= end_constraint]
        
        if len(valid_dates) < len(forecast_dates):
            logger.info(f"Truncating forecast to end at April 2026 (removed {len(forecast_dates) - len(valid_dates)} months)")
            forecast = forecast[:len(valid_dates)]
            forecast_dates = valid_dates
        
        # Create forecast dataframe
        forecast_df = pd.DataFrame({
            'month': forecast_dates,
            'revenue': forecast.values,
        })
        
        # Ensure no negative values
        forecast_df['revenue'] = forecast_df['revenue'].clip(lower=0)
        
        # Add forecast method
        forecast_df['method'] = 'ARIMA'
        
        # Check if more than 50% of historical months are $0
        zero_months_percentage = (historical_data['revenue'] == 0).mean() * 100
        if zero_months_percentage > 50:
            forecast_df['confidence_label'] = 'Low Confidence'
        else:
            forecast_df['confidence_label'] = 'Normal Confidence'
        
        logger.info(f"Successfully generated {len(forecast_df)}-month ARIMA forecast")
        return forecast_df
        
    except Exception as e:
        logger.error(f"ARIMA prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ARIMA prediction error: {str(e)}")

# Function to generate 5-year forecast using Holt-Winters Exponential Smoothing
def generate_holtwinters_forecast(historical_data: pd.DataFrame, periods: int = 60):
    """Generate 5-year forecast using Holt-Winters Exponential Smoothing with trend and seasonality"""
    try:
        logger.info(f"Generating {periods}-month Holt-Winters forecast based on {len(historical_data)} months of historical data")
        
        # Check if historical data is empty or doesn't have required columns
        if historical_data.empty:
            logger.error("Historical data is empty")
            raise HTTPException(status_code=404, detail="No historical data available for forecasting")
        
        # Ensure we have the revenue column
        if 'revenue' not in historical_data.columns:
            logger.error("Revenue column not found in historical data")
            raise HTTPException(status_code=500, detail="Revenue data not available for forecasting")
        
        # Sort by month
        historical_data = historical_data.sort_values('month')
        
        # Extract revenue series
        revenue_series = historical_data.set_index('month')['revenue']
        
        # Check if we have enough data for seasonal model
        if len(revenue_series) >= 24:  # At least 2 years of data for seasonal model
            # Use Holt-Winters with multiplicative seasonality
            model = ExponentialSmoothing(
                revenue_series,
                trend='add',
                seasonal='mul',
                seasonal_periods=12,
                damped_trend=True
            )
        elif len(revenue_series) >= 12:  # At least 1 year for seasonal model
            # Use Holt-Winters with additive seasonality
            model = ExponentialSmoothing(
                revenue_series,
                trend='add',
                seasonal='add',
                seasonal_periods=12,
                damped_trend=True
            )
        else:
            # Use Holt's method (trend but no seasonality)
            model = ExponentialSmoothing(
                revenue_series,
                trend='add',
                seasonal=None,
                damped_trend=True
            )
        
        # Fit the model
        results = model.fit(optimized=True)
        
        # Generate forecast
        forecast = results.forecast(periods)
        
        # Create forecast dates
        last_date = historical_data['month'].max()
        forecast_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')
        
        # Create forecast dataframe
        forecast_df = pd.DataFrame({
            'month': forecast_dates,
            'revenue': forecast.values,
        })
        
        # Ensure no negative values
        forecast_df['revenue'] = forecast_df['revenue'].clip(lower=0)
        
        # Add forecast method
        forecast_df['method'] = 'Holt-Winters'
        
        # Add warning label for long-term forecast
        forecast_df['warning'] = 'Highly speculative – Based on historical data patterns.'
        
        # Check if more than 50% of historical months are $0
        zero_months_percentage = (historical_data['revenue'] == 0).mean() * 100
        if zero_months_percentage > 50:
            forecast_df['confidence_label'] = 'Low Confidence'
        else:
            forecast_df['confidence_label'] = 'Normal Confidence'
        
        logger.info(f"Successfully generated {periods}-month Holt-Winters forecast")
        return forecast_df
        
    except Exception as e:
        logger.error(f"Holt-Winters prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Holt-Winters prediction error: {str(e)}")

@router.get("/6-month")
async def get_six_month_prediction(
    seller_id: str = Query("1", description="Seller ID"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 6-month prediction for seller {seller_id}")
        # Get historical data with fixed date range (Jan 2024 - Apr 2025)
        historical_data = await get_historical_sales_data(seller_id, use_mock_data=use_mock_data)
        
        # Output verification table of monthly revenue
        monthly_revenue_table = historical_data[['month', 'revenue']].copy()
        monthly_revenue_table['month_str'] = monthly_revenue_table['month'].dt.strftime('%Y-%m')
        logger.info("Monthly Revenue Table (Jan 2024 - Apr 2025):")
        for _, row in monthly_revenue_table.iterrows():
            logger.info(f"{row['month_str']}: ${row['revenue']:.2f}")
        
        # Generate 6-month prediction using ARIMA (function name kept as generate_prophet_forecast for compatibility)
        forecast = generate_prophet_forecast(historical_data, 6)
        
        # Clean any NaN values
        forecast_data = clean_nan_values(json.loads(forecast.to_json(orient='records', date_format='iso')))
        
        # Format response
        response = {
            "prediction_type": "6-month",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": forecast_data,
            "data_source": "real" if force_real_data else "mixed",
            "method": "ARIMA",
            "confidence_intervals": True
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 6-month prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/1-year")
async def get_one_year_prediction(
    seller_id: str = Query("1", description="Seller ID"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 1-year prediction for seller {seller_id}")
        # Get historical data with fixed date range (Jan 2024 - Apr 2025)
        historical_data = await get_historical_sales_data(seller_id, use_mock_data=use_mock_data)
        
        # Output verification table of monthly revenue
        monthly_revenue_table = historical_data[['month', 'revenue']].copy()
        monthly_revenue_table['month_str'] = monthly_revenue_table['month'].dt.strftime('%Y-%m')
        logger.info("Monthly Revenue Table (Jan 2024 - Apr 2025):")
        for _, row in monthly_revenue_table.iterrows():
            logger.info(f"{row['month_str']}: ${row['revenue']:.2f}")
        
        # Generate 1-year prediction using ARIMA
        forecast = generate_arima_forecast(historical_data, 12)
        
        # Clean any NaN values
        forecast_data = clean_nan_values(json.loads(forecast.to_json(orient='records', date_format='iso')))
        
        # Format response
        response = {
            "prediction_type": "1-year",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": forecast_data,
            "data_source": "real" if force_real_data else "mixed",
            "method": "ARIMA",
            "constraint": "Forecast ends at April 2026"
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 1-year prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/5-year")
async def get_five_year_prediction(
    seller_id: str = Query("1", description="Seller ID"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 5-year prediction for seller {seller_id}")
        # Get historical data with fixed date range (Jan 2024 - Apr 2025)
        historical_data = await get_historical_sales_data(seller_id, use_mock_data=use_mock_data)
        
        # Output verification table of monthly revenue
        monthly_revenue_table = historical_data[['month', 'revenue']].copy()
        monthly_revenue_table['month_str'] = monthly_revenue_table['month'].dt.strftime('%Y-%m')
        logger.info("Monthly Revenue Table (Jan 2024 - Apr 2025):")
        for _, row in monthly_revenue_table.iterrows():
            logger.info(f"{row['month_str']}: ${row['revenue']:.2f}")
        
        # Generate 5-year prediction using Holt-Winters
        forecast = generate_holtwinters_forecast(historical_data, 60)
        
        # Clean any NaN values
        forecast_data = clean_nan_values(json.loads(forecast.to_json(orient='records', date_format='iso')))
        
        # Format response
        response = {
            "prediction_type": "5-year",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": forecast_data,
            "data_source": "real" if force_real_data else "mixed",
            "method": "Holt-Winters Exponential Smoothing",
            "warning": "Highly speculative – Based on historical data patterns."
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 5-year prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))  

@router.get("/summary")
async def get_prediction_summary(
    seller_id: str = Query("1", description="Seller ID"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating prediction summary for seller {seller_id}")
        # Get historical data with fixed date range (Jan 2024 - Apr 2025)
        historical_data = await get_historical_sales_data(seller_id, use_mock_data=use_mock_data)
        
        # Output verification table of monthly revenue
        monthly_revenue_table = historical_data[['month', 'revenue']].copy()
        monthly_revenue_table['month_str'] = monthly_revenue_table['month'].dt.strftime('%Y-%m')
        logger.info("Monthly Revenue Table (Jan 2024 - Apr 2025):")
        for _, row in monthly_revenue_table.iterrows():
            logger.info(f"{row['month_str']}: ${row['revenue']:.2f}")
        
        # Generate predictions for different time periods
        six_month = generate_prophet_forecast(historical_data, 6)
        one_year = generate_arima_forecast(historical_data, 12)
        five_year = generate_holtwinters_forecast(historical_data, 60)
        
        # Calculate summary statistics
        six_month_revenue = six_month['revenue'].sum()
        one_year_revenue = one_year['revenue'].sum()
        five_year_revenue = five_year['revenue'].sum()
        
        # Calculate average monthly order count and units sold from historical data
        avg_monthly_orders = historical_data['order_count'].mean()
        avg_monthly_units = historical_data['units_sold'].mean()
        
        # Calculate projected orders and units for each time period
        # For 6 months
        six_month_orders = max(1, round(avg_monthly_orders * 6))
        six_month_units = max(1, round(avg_monthly_units * 6))
        
        # For 1 year
        one_year_orders = max(1, round(avg_monthly_orders * 12))
        one_year_units = max(1, round(avg_monthly_units * 12))
        
        # For 5 years (60 months)
        # Apply a growth factor for long-term projections
        growth_factor = 1.5  # Assuming 50% growth over 5 years
        five_year_orders = max(1, round(avg_monthly_orders * 60 * growth_factor))
        five_year_units = max(1, round(avg_monthly_units * 60 * growth_factor))
        
        # Check if more than 50% of historical months are $0
        zero_months_percentage = (historical_data['revenue'] == 0).mean() * 100
        low_confidence = zero_months_percentage > 50
        
        # Create response data
        response_data = {
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data_source": "real" if force_real_data else "mixed",
            "historical_data": {
                "date_range": "January 1, 2024 to April 1, 2025",
                "months": len(historical_data),
                "total_revenue": round(float(historical_data['revenue'].sum()), 2),
                "zero_revenue_months_percentage": round(float(zero_months_percentage), 2)
            },
            "six_month": {
                "method": "ARIMA",
                "total_revenue": round(float(six_month_revenue), 2),
                "total_orders": six_month_orders,
                "total_units": six_month_units,
                "confidence_intervals": True,
                "confidence_level": "Low" if low_confidence else "Normal",
                "revenue_growth": 0  # Default value
            },
            "one_year": {
                "method": "ARIMA",
                "total_revenue": round(float(one_year_revenue), 2),
                "total_orders": one_year_orders,
                "total_units": one_year_units,
                "constraint": "Forecast ends at April 2026",
                "confidence_level": "Low" if low_confidence else "Normal"
            },
            "five_year": {
                "method": "Holt-Winters Exponential Smoothing",
                "total_revenue": round(float(five_year_revenue), 2),
                "total_orders": five_year_orders,  # Added non-zero value
                "total_units": five_year_units,    # Added non-zero value
                "warning": "Highly speculative – Based on historical data patterns.",
                "confidence_level": "Low" if low_confidence else "Normal"
            }
        }
        
        # Clean any NaN values
        clean_response = clean_nan_values(response_data)
        
        return JSONResponse(content=clean_response)
    except Exception as e:
        logger.error(f"Error in prediction summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-products/6-month")
async def get_top_products_six_month(
    seller_id: str = Query("1", description="Seller ID"),
    limit: int = Query(10, description="Number of top products to return"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 6-month top products prediction for seller {seller_id}")
        # Get historical product data
        historical_data = await get_historical_product_data(seller_id, use_mock_data=use_mock_data)
        
        # Group by product
        product_groups = historical_data.groupby(['product_id', 'product_name', 'product_image', 'product_price', 'product_category'])
        
        # Calculate total revenue and units for each product
        product_totals = []
        for (product_id, product_name, product_image, product_price, product_category), group in product_groups:
            # Sort by month
            group = group.sort_values('month')
            
            # Calculate total revenue and units
            total_revenue = group['revenue'].sum()
            total_units = group['units_sold'].sum()
            
            # Calculate monthly averages
            avg_monthly_revenue = total_revenue / len(group)
            avg_monthly_units = total_units / len(group)
            
            # Calculate growth rate (last month vs first month)
            if len(group) >= 2:
                first_month_revenue = group.iloc[0]['revenue']
                last_month_revenue = group.iloc[-1]['revenue']
                if first_month_revenue > 0:
                    growth_rate = ((last_month_revenue / first_month_revenue) - 1) * 100
                else:
                    growth_rate = 0
            else:
                growth_rate = 0
            
            # Add to product totals
            product_totals.append({
                "product_id": product_id,
                "product_name": product_name,
                "product_image": product_image,
                "product_price": product_price,
                "product_category": product_category,
                "total_revenue": total_revenue,
                "total_units": total_units,
                "avg_monthly_revenue": avg_monthly_revenue,
                "avg_monthly_units": avg_monthly_units,
                "growth_rate": growth_rate
            })
        
        # Sort by total revenue (descending)
        product_totals.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        # Limit to requested number of products
        top_products = product_totals[:limit]
        
        # Clean any NaN values
        top_products = clean_nan_values(top_products)
        
        # Format response
        response = {
            "prediction_type": "top-products-6-month",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": top_products,
            "data_source": "real" if force_real_data else "mixed"
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 6-month top products prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-products/1-year")
async def get_top_products_one_year(
    seller_id: str = Query("1", description="Seller ID"),
    limit: int = Query(10, description="Number of top products to return"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 1-year top products prediction for seller {seller_id}")
        # Get historical product data
        historical_data = await get_historical_product_data(seller_id, use_mock_data=use_mock_data)
        
        # Group by product
        product_groups = historical_data.groupby(['product_id', 'product_name', 'product_image', 'product_price', 'product_category'])
        
        # Calculate total revenue and units for each product
        product_totals = []
        for (product_id, product_name, product_image, product_price, product_category), group in product_groups:
            # Sort by month
            group = group.sort_values('month')
            
            # Calculate total revenue and units
            total_revenue = group['revenue'].sum()
            total_units = group['units_sold'].sum()
            
            # Calculate monthly averages
            avg_monthly_revenue = total_revenue / len(group)
            avg_monthly_units = total_units / len(group)
            
            # Calculate growth rate (last month vs first month)
            if len(group) >= 2:
                first_month_revenue = group.iloc[0]['revenue']
                last_month_revenue = group.iloc[-1]['revenue']
                if first_month_revenue > 0:
                    growth_rate = ((last_month_revenue / first_month_revenue) - 1) * 100
                else:
                    growth_rate = 0
            else:
                growth_rate = 0
            
            # For 1-year prediction, apply a growth factor
            growth_factor = 1 + (growth_rate / 100)
            # Cap growth factor to reasonable range
            growth_factor = max(0.5, min(2.0, growth_factor))
            
            # Project revenue and units for 1 year
            projected_revenue = total_revenue * growth_factor * 1.2  # 20% additional growth for 1 year
            projected_units = total_units * growth_factor * 1.2
            
            # Add to product totals
            product_totals.append({
                "product_id": product_id,
                "product_name": product_name,
                "product_image": product_image,
                "product_price": product_price,
                "product_category": product_category,
                "total_revenue": projected_revenue,
                "total_units": projected_units,
                "avg_monthly_revenue": avg_monthly_revenue * growth_factor * 1.2,
                "avg_monthly_units": avg_monthly_units * growth_factor * 1.2,
                "growth_rate": growth_rate
            })
        
        # Sort by total revenue (descending)
        product_totals.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        # Limit to requested number of products
        top_products = product_totals[:limit]
        
        # Clean any NaN values
        top_products = clean_nan_values(top_products)
        
        # Format response
        response = {
            "prediction_type": "top-products-1-year",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": top_products,
            "data_source": "real" if force_real_data else "mixed"
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 1-year top products prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-products/5-year")
async def get_top_products_five_year(
    seller_id: str = Query("1", description="Seller ID"),
    limit: int = Query(10, description="Number of top products to return"),
    use_mock_data: bool = Query(False, description="Use mock data if real data is not available"),
    force_real_data: bool = Query(True, description="Force using real data even if predictions are low"),
    min_scale_factor: float = Query(100.0, description="Scale factor to apply to low predictions"),
    min_data_points: int = Query(5, description="Minimum number of data points required for forecasting")
):
    try:
        logger.info(f"Generating 5-year top products prediction for seller {seller_id}")
        # Get historical product data
        historical_data = await get_historical_product_data(seller_id, use_mock_data=use_mock_data)
        
        # Group by product
        product_groups = historical_data.groupby(['product_id', 'product_name', 'product_image', 'product_price', 'product_category'])
        
        # Calculate total revenue and units for each product
        product_totals = []
        for (product_id, product_name, product_image, product_price, product_category), group in product_groups:
            # Sort by month
            group = group.sort_values('month')
            
            # Calculate total revenue and units
            total_revenue = group['revenue'].sum()
            total_units = group['units_sold'].sum()
            
            # Calculate monthly averages
            avg_monthly_revenue = total_revenue / len(group)
            avg_monthly_units = total_units / len(group)
            
            # Calculate growth rate (last month vs first month)
            if len(group) >= 2:
                first_month_revenue = group.iloc[0]['revenue']
                last_month_revenue = group.iloc[-1]['revenue']
                if first_month_revenue > 0:
                    growth_rate = ((last_month_revenue / first_month_revenue) - 1) * 100
                else:
                    growth_rate = 0
            else:
                growth_rate = 0
            
            # For 5-year prediction, apply a growth factor
            growth_factor = 1 + (growth_rate / 100)
            # Cap growth factor to reasonable range
            growth_factor = max(0.5, min(2.0, growth_factor))
            
            # Project revenue and units for 5 years
            projected_revenue = total_revenue * growth_factor * 2.0  # 100% additional growth for 5 years
            projected_units = total_units * growth_factor * 2.0
            
            # Add to product totals
            product_totals.append({
                "product_id": product_id,
                "product_name": product_name,
                "product_image": product_image,
                "product_price": product_price,
                "product_category": product_category,
                "total_revenue": projected_revenue,
                "total_units": projected_units,
                "avg_monthly_revenue": avg_monthly_revenue * growth_factor * 2.0,
                "avg_monthly_units": avg_monthly_units * growth_factor * 2.0,
                "growth_rate": growth_rate
            })
        
        # Sort by total revenue (descending)
        product_totals.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        # Limit to requested number of products
        top_products = product_totals[:limit]
        
        # Clean any NaN values
        top_products = clean_nan_values(top_products)
        
        # Format response
        response = {
            "prediction_type": "top-products-5-year",
            "seller_id": seller_id,
            "generated_at": datetime.now().isoformat(),
            "data": top_products,
            "data_source": "real" if force_real_data else "mixed",
            "warning": "Highly speculative – Based on historical data patterns."
        }
        
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error in 5-year top products prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add a health check endpoint
@router.get("/health")
async def health_check():
    try:
        # Test database connection
        db.command("ping")
        # Return success response
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Add a data refresh endpoint to force reload data from database
@router.post("/refresh-data/{seller_id}")
async def refresh_seller_data(seller_id: str):
    try:
        # Clear any cached data for this seller
        db.predictions.delete_many({"seller_id": seller_id})
        
        # Force reload data
        await get_seller_overview(seller_id, period="all")
        await get_product_statistics(seller_id)
        
        return {"message": f"Data refreshed for seller {seller_id}"}
    except Exception as e:
        logger.error(f"Error refreshing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error refreshing data: {str(e)}")