from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import os
import numpy as np
from sklearn.linear_model import LinearRegression
from pymongo import MongoClient

# Import from users.py
from .users import get_current_user, get_current_active_user

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

router = APIRouter()

@router.get("/sales/{product_id}", response_model=Dict[str, Any])
async def predict_product_sales(
  product_id: str,
  days: int = 30,
  current_user: dict = Depends(get_current_active_user)
):
  # Get product
  product = db.products.find_one({"_id": ObjectId(product_id)})
  if not product:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="Product not found"
      )
  
  # Check if user has permission to view this product's predictions
  is_owner = str(product["seller_id"]) == current_user["_id"]
  is_superadmin = current_user["role"] == "superadmin"
  
  if not (is_owner or is_superadmin):
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not authorized to view this product's predictions"
      )
  
  # Check if we have a recent prediction in the database
  recent_prediction = db.predictions.find_one({
      "product_id": product_id,
      "days": days,
      "prediction_date": {"$gte": datetime.utcnow() - timedelta(days=1)}  # Predictions less than 1 day old
  })
  
  if recent_prediction:
      # Convert ObjectId to string
      recent_prediction["_id"] = str(recent_prediction["_id"])
      recent_prediction["product_id"] = str(recent_prediction["product_id"])
      recent_prediction["seller_id"] = str(recent_prediction["seller_id"])
      
      # Format the response
      return {
          "product_id": product_id,
          "product_name": product["name"],
          "prediction_days": days,
          "predicted_sales": recent_prediction["predicted_sales"],
          "predicted_revenue": recent_prediction["predicted_revenue"],
          "total_predicted_sales": sum(recent_prediction["predicted_sales"]),
          "total_predicted_revenue": sum(recent_prediction["predicted_revenue"]),
          "confidence": recent_prediction["confidence"],
          "prediction_date": recent_prediction["prediction_date"].isoformat()
      }
  
  # Get historical sales data
  end_date = datetime.utcnow()
  start_date = end_date - timedelta(days=90)  # Use last 90 days for training
  
  pipeline = [
      {
          "$match": {
              "items.product_id": product_id,
              "status": "completed",
              "created_at": {"$gte": start_date, "$lte": end_date}
          }
      },
      {"$unwind": "$items"},
      {
          "$match": {
              "items.product_id": product_id
          }
      },
      {
          "$group": {
              "_id": {
                  "year": {"$year": "$created_at"},
                  "month": {"$month": "$created_at"},
                  "day": {"$dayOfMonth": "$created_at"}
              },
              "quantity": {"$sum": "$items.quantity"},
              "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
          }
      },
      {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
  ]
  
  sales_data = list(db.orders.aggregate(pipeline))
  
  # Prepare data for prediction
  if not sales_data:
      # No historical data, use default predictions
      predicted_quantities = [0] * days
      predicted_revenues = [0] * days
      confidence = 0
  else:
      # Convert sales data to time series
      dates = []
      quantities = []
      revenues = []
      
      for data in sales_data:
          year = data["_id"]["year"]
          month = data["_id"]["month"]
          day = data["_id"]["day"]
          date = datetime(year, month, day)
          dates.append(date)
          quantities.append(data["quantity"])
          revenues.append(data["revenue"])
      
      # Convert dates to numeric (days since first date)
      first_date = min(dates)
      X = np.array([(date - first_date).days for date in dates]).reshape(-1, 1)
      y_quantity = np.array(quantities)
      y_revenue = np.array(revenues)
      
      # Train linear regression models
      model_quantity = LinearRegression()
      model_revenue = LinearRegression()
      
      model_quantity.fit(X, y_quantity)
      model_revenue.fit(X, y_revenue)
      
      # Generate predictions
      last_day = (max(dates) - first_date).days
      future_days = np.array(range(last_day + 1, last_day + days + 1)).reshape(-1, 1)
      
      predicted_quantities = model_quantity.predict(future_days)
      predicted_revenues = model_revenue.predict(future_days)
      
      # Ensure no negative predictions
      predicted_quantities = np.maximum(predicted_quantities, 0)
      predicted_revenues = np.maximum(predicted_revenues, 0)
      
      # Calculate confidence (R² score)
      confidence_quantity = model_quantity.score(X, y_quantity)
      confidence_revenue = model_revenue.score(X, y_revenue)
      confidence = (confidence_quantity + confidence_revenue) / 2
  
  # Format predictions
  predicted_quantities_list = [round(float(q), 2) for q in predicted_quantities]
  predicted_revenues_list = [round(float(r), 2) for r in predicted_revenues]
  
  # Save prediction to database
  prediction = {
      "product_id": product_id,
      "seller_id": str(product["seller_id"]),
      "prediction_date": datetime.utcnow(),
      "days": days,
      "predicted_sales": predicted_quantities_list,
      "predicted_revenue": predicted_revenues_list,
      "confidence": round(float(confidence), 2),
      "created_at": datetime.utcnow()
  }
  
  db.predictions.insert_one(prediction)
  
  # Format response
  return {
      "product_id": product_id,
      "product_name": product["name"],
      "prediction_days": days,
      "predicted_sales": predicted_quantities_list,
      "predicted_revenue": predicted_revenues_list,
      "total_predicted_sales": round(float(sum(predicted_quantities)), 2),
      "total_predicted_revenue": round(float(sum(predicted_revenues)), 2),
      "confidence": round(float(confidence), 2),
      "prediction_date": datetime.utcnow().isoformat()
  }

@router.get("/sales/seller/me", response_model=Dict[str, Any])
async def predict_current_seller_sales(
  days: int = 30,
  current_user: dict = Depends(get_current_active_user)
):
  # Use the current user's ID
  seller_id = current_user["_id"]
  
  # Check if user is a seller
  if current_user["role"] != "seller" and current_user["role"] != "superadmin":
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Only sellers can access their sales predictions"
      )
  
  # Reuse the seller prediction logic
  return await predict_seller_sales(seller_id, days, current_user)

@router.get("/sales/seller/{seller_id}", response_model=Dict[str, Any])
async def predict_seller_sales(
  seller_id: str,
  days: int = 30,
  current_user: dict = Depends(get_current_active_user)
):
  # Check if user has permission to view this seller's predictions
  is_self = seller_id == current_user["_id"]
  is_superadmin = current_user["role"] == "superadmin"
  
  if not (is_self or is_superadmin):
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not authorized to view this seller's predictions"
      )
  
  # Check if we have a recent prediction in the database
  recent_prediction = db.predictions.find_one({
      "seller_id": seller_id,
      "product_id": {"$exists": False},  # This is a seller-level prediction
      "days": days,
      "prediction_date": {"$gte": datetime.utcnow() - timedelta(days=1)}  # Predictions less than 1 day old
  })
  
  if recent_prediction:
      # Convert ObjectId to string
      recent_prediction["_id"] = str(recent_prediction["_id"])
      recent_prediction["seller_id"] = str(recent_prediction["seller_id"])
      
      # Get seller's products
      products = list(db.products.find({"seller_id": ObjectId(seller_id)}))
      product_info = [{"product_id": str(p["_id"]), "name": p["name"]} for p in products]
      
      # Format the response
      return {
          "seller_id": seller_id,
          "prediction_days": days,
          "predicted_sales": recent_prediction["predicted_sales"],
          "predicted_revenue": recent_prediction["predicted_revenue"],
          "total_predicted_sales": sum(recent_prediction["predicted_sales"]),
          "total_predicted_revenue": sum(recent_prediction["predicted_revenue"]),
          "confidence": recent_prediction["confidence"],
          "prediction_date": recent_prediction["prediction_date"].isoformat(),
          "products": product_info
      }
  
  # Get seller's products
  products = list(db.products.find({"seller_id": ObjectId(seller_id)}))
  product_ids = [str(product["_id"]) for product in products]
  
  if not product_ids:
      # No products, return empty predictions
      prediction = {
          "seller_id": seller_id,
          "prediction_date": datetime.utcnow(),
          "days": days,
          "predicted_sales": [0] * days,
          "predicted_revenue": [0] * days,
          "confidence": 0,
          "created_at": datetime.utcnow()
      }
      
      db.predictions.insert_one(prediction)
      
      return {
          "seller_id": seller_id,
          "prediction_days": days,
          "predicted_sales": [0] * days,
          "predicted_revenue": [0] * days,
          "total_predicted_sales": 0,
          "total_predicted_revenue": 0,
          "confidence": 0,
          "prediction_date": datetime.utcnow().isoformat(),
          "products": [{"product_id": p_id, "name": next((p["name"] for p in products if str(p["_id"]) == p_id), "")} for p_id in product_ids]
      }
  
  # Get historical sales data
  end_date = datetime.utcnow()
  start_date = end_date - timedelta(days=90)  # Use last 90 days for training
  
  pipeline = [
      {
          "$match": {
              "items.seller_id": seller_id,
              "status": "completed",
              "created_at": {"$gte": start_date, "$lte": end_date}
          }
      },
      {"$unwind": "$items"},
      {
          "$match": {
              "items.seller_id": seller_id
          }
      },
      {
          "$group": {
              "_id": {
                  "year": {"$year": "$created_at"},
                  "month": {"$month": "$created_at"},
                  "day": {"$dayOfMonth": "$created_at"}
              },
              "quantity": {"$sum": "$items.quantity"},
              "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
          }
      },
      {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
  ]
  
  sales_data = list(db.orders.aggregate(pipeline))
  
  # Prepare data for prediction
  if not sales_data:
      # No historical data, use default predictions
      predicted_quantities = [0] * days
      predicted_revenues = [0] * days
      confidence = 0
  else:
      # Convert sales data to time series
      dates = []
      quantities = []
      revenues = []
      
      for data in sales_data:
          year = data["_id"]["year"]
          month = data["_id"]["month"]
          day = data["_id"]["day"]
          date = datetime(year, month, day)
          dates.append(date)
          quantities.append(data["quantity"])
          revenues.append(data["revenue"])
      
      # Convert dates to numeric (days since first date)
      first_date = min(dates)
      X = np.array([(date - first_date).days for date in dates]).reshape(-1, 1)
      y_quantity = np.array(quantities)
      y_revenue = np.array(revenues)
      
      # Train linear regression models
      model_quantity = LinearRegression()
      model_revenue = LinearRegression()
      
      model_quantity.fit(X, y_quantity)
      model_revenue.fit(X, y_revenue)
      
      # Generate predictions
      last_day = (max(dates) - first_date).days
      future_days = np.array(range(last_day + 1, last_day + days + 1)).reshape(-1, 1)
      
      predicted_quantities = model_quantity.predict(future_days)
      predicted_revenues = model_revenue.predict(future_days)
      
      # Ensure no negative predictions
      predicted_quantities = np.maximum(predicted_quantities, 0)
      predicted_revenues = np.maximum(predicted_revenues, 0)
      
      # Calculate confidence (R² score)
      confidence_quantity = model_quantity.score(X, y_quantity)
      confidence_revenue = model_revenue.score(X, y_revenue)
      confidence = (confidence_quantity + confidence_revenue) / 2
  
  # Format predictions
  predicted_quantities_list = [round(float(q), 2) for q in predicted_quantities]
  predicted_revenues_list = [round(float(r), 2) for r in predicted_revenues]
  
  # Save prediction to database
  prediction = {
      "seller_id": seller_id,
      "prediction_date": datetime.utcnow(),
      "days": days,
      "predicted_sales": predicted_quantities_list,
      "predicted_revenue": predicted_revenues_list,
      "confidence": round(float(confidence), 2),
      "created_at": datetime.utcnow()
  }
  
  db.predictions.insert_one(prediction)
  
  # Format response
  return {
      "seller_id": seller_id,
      "prediction_days": days,
      "predicted_sales": predicted_quantities_list,
      "predicted_revenue": predicted_revenues_list,
      "total_predicted_sales": round(float(sum(predicted_quantities)), 2),
      "total_predicted_revenue": round(float(sum(predicted_revenues)), 2),
      "confidence": round(float(confidence), 2),
      "prediction_date": datetime.utcnow().isoformat(),
      "products": [{"product_id": p_id, "name": next((p["name"] for p in products if str(p["_id"]) == p_id), "")} for p_id in product_ids]
  }

