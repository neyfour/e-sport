import os
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Dict, Any
from datetime import datetime, timedelta
import jwt
from pymongo import MongoClient
from bson import ObjectId
import json
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="E-Commerce API", version="1.0.0")

# Configure CORS
origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  # Add production domains here
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "2ca83451c4cfa6b46d3826319fec5fc877c946cec7ce0d0cdaf266fedb7d9ae1")
ALGORITHM = "HS256"

# Import routers
from routers import users, products, orders, notifications, chat, seller_applications, payments, seller_payouts, promotions, statistics, predictions, settings, sellerdashboard, sellerstatistic, sellerprediction, chatbot, superadmindashboard, sa_product, sellercommission,review_api

# Initialize WebSocket connection manager for chat
class ConnectionManager:
  def __init__(self):
      self.active_connections: Dict[str, WebSocket] = {}
      self.seller_admin_connections: Dict[str, List[Dict[str, Any]]] = {}
  
  async def connect(self, websocket: WebSocket, user_id: str):
      await websocket.accept()
      self.active_connections[user_id] = websocket
      
      # Get user role
      user = db.users.find_one({"_id": ObjectId(user_id)})
      if not user:
          return
      
      # For seller-admin chat
      if user["role"] == "seller":
          # Create a room for this seller
          if "seller_admin" not in self.seller_admin_connections:
              self.seller_admin_connections["seller_admin"] = []
          
          self.seller_admin_connections["seller_admin"].append({
              "websocket": websocket,
              "user_id": user_id,
              "role": "seller"
          })
      
      elif user["role"] == "superadmin":
          # Add admin to seller-admin room
          if "seller_admin" not in self.seller_admin_connections:
              self.seller_admin_connections["seller_admin"] = []
          
          self.seller_admin_connections["seller_admin"].append({
              "websocket": websocket,
              "user_id": user_id,
              "role": "superadmin"
          })
  
  def disconnect(self, websocket: WebSocket, user_id: str):
      if user_id in self.active_connections:
          del self.active_connections[user_id]
      
      # Remove from seller-admin chat
      if "seller_admin" in self.seller_admin_connections:
          self.seller_admin_connections["seller_admin"] = [
              conn for conn in self.seller_admin_connections["seller_admin"] 
              if conn["websocket"] != websocket
          ]
  
  async def send_personal_message(self, message: str, user_id: str):
      if user_id in self.active_connections:
          await self.active_connections[user_id].send_text(message)
  
  async def broadcast_to_seller_admin(self, message: str, exclude_user_id: str = None):
      if "seller_admin" in self.seller_admin_connections:
          for conn in self.seller_admin_connections["seller_admin"]:
              if exclude_user_id and conn["user_id"] == exclude_user_id:
                  continue
              await conn["websocket"].send_text(message)

manager = ConnectionManager()

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(seller_applications.router, prefix="/seller-applications", tags=["seller applications"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(seller_payouts.router, prefix="/seller-payouts", tags=["seller payouts"])
app.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
app.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(settings.router)
app.include_router(sellerdashboard.router, prefix="/sellerdashboard", tags=["sellerdashboard"])
app.include_router(sellerstatistic.router)
app.include_router(sellerprediction.router)
app.include_router(chatbot.router)
app.include_router(superadmindashboard.router)
# Super Admin Product Router
app.include_router(sa_product.router, prefix="/sa_products", tags=["sa_product"])
app.include_router(sellercommission.router, prefix="/sellercommissions", tags=["sellercommissions"])
app.include_router(review_api.router, prefix="/reviews", tags=["reviews"])                                                        



# WebSocket endpoint for chat
@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
  await manager.connect(websocket, user_id)
  try:
      while True:
          data = await websocket.receive_text()
          message_data = json.loads(data)
          
          # Save message to database
          message = {
              "sender_id": user_id,
              "receiver_id": message_data.get("receiver_id"),
              "content": message_data.get("content"),
              "timestamp": datetime.utcnow(),
              "read": False
          }
          
          result = db.chat_messages.insert_one(message)
          message["_id"] = str(result.inserted_id)
          
          # Get sender details
          sender = db.users.find_one({"_id": ObjectId(user_id)})
          sender_role = sender.get("role", "customer")
          
          # Format message for sending
          formatted_message = {
              "_id": str(message["_id"]),
              "sender_id": user_id,
              "receiver_id": message_data.get("receiver_id"),
              "content": message_data.get("content"),
              "timestamp": message["timestamp"].isoformat(),
              "read": False,
              "sender": {
                  "_id": user_id,
                  "username": sender.get("username", "Unknown"),
                  "role": sender_role
              }
          }
          
          # Send to specific receiver if provided
          if message_data.get("receiver_id"):
              await manager.send_personal_message(json.dumps(formatted_message), message_data.get("receiver_id"))
          
          # For seller-admin chat, broadcast to the room
          if sender_role in ["seller", "superadmin"]:
              await manager.broadcast_to_seller_admin(json.dumps(formatted_message), user_id)
          
          # Send confirmation back to sender
          await websocket.send_text(json.dumps({
              "status": "sent", 
              "message_id": str(message["_id"]),
              "message": formatted_message
          }))
          
          # Create notification for receiver
          notification = {
              "user_id": message_data.get("receiver_id"),
              "type": "chat_message",
              "title": "New Message",
              "message": f"You have a new message from {sender.get('username', 'Unknown')}",
              "read": False,
              "created_at": datetime.utcnow(),
              "data": {
                  "sender_id": user_id,
                  "message_id": str(message["_id"])
              }
          }
          
          db.notifications.insert_one(notification)
          
  except WebSocketDisconnect:
      manager.disconnect(websocket, user_id)
  except Exception as e:
      print(f"WebSocket error: {str(e)}")
      manager.disconnect(websocket, user_id)

@app.get("/", tags=["root"])
async def root():
  return {"message": "Welcome to the E-Commerce API"}

# Health check endpoint
@app.get("/health")
async def health_check():
  try:
      # Check MongoDB connection
      client.admin.command('ping')
      db_status = "connected"
  except Exception as e:
      db_status = f"error: {str(e)}"
  
  return {
      "status": "healthy",
      "database": db_status,
      "version": "1.0.0"
  }

# Create static directory if it doesn't exist
static_dir = os.getenv("STATIC_DIR", "static")
images_dir = os.path.join(static_dir, "images")

Path(static_dir).mkdir(exist_ok=True)
Path(images_dir).mkdir(exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=static_dir), name="static")
# Mount static files directory
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Run database migration if needed
if os.getenv("RUN_MIGRATION", "false").lower() == "true":
  import db_migration
  db_migration.run_migration()

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

