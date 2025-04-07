from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv
import json
from pymongo import MongoClient
from bson import ObjectId
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client.get_database("ecommerce_db")

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in environment variables")

# Initialize router
router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# Helper function to convert ObjectId to string for JSON serialization
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

# Enhanced System Prompt
SYSTEM_PROMPT = """
You are Alex Assistant, the AI helper for E-SPORTS Store where a custumer can become a seller and sell sports products in our store - a premier sports equipment e-commerce platform.

Key Guidelines:
1. Payment Methods:
   - We ONLY accept Visa, Mastercard, and American Express
   - Never mention PayPal or other payment methods
   - If asked about PayPal, respond: "We only accept credit/debit cards (Visa, Mastercard, American Express)"

2. Product Responses:
   - When asked about products, ONLY mention products that exist in our database
   - Provide accurate details from the product database
   - If a product doesn't exist in our database, say "We don't currently carry that product"

3. Response Length:
   - Match the length of your response to the user's question
   - For simple questions, provide brief answers (1-2 sentences)
   - For complex questions, provide detailed responses
   - When unsure, default to medium-length responses

4. Tone and Style:
   - Be naturally conversational but professional
   - Mirror the user's communication style slightly
   - Use simple language for simple questions
   - Provide more technical details when asked complex questions
5. Become a seller:
   - If asked about becoming a seller , say : "first you need to create an account and then you can become a seller by clicking on the become a seller button in Home page and you will be directed to fill a formular of futur seller application , then the superadmin will review your application and if accepted or rejected you will be notified  and if the first case you will be able to sell your products in our store"
6. Support and help:
    - If asked for help or support, provide clear instructions by giving him contact information like email " e.sportscompany.contact@gmail.com " to contact our team or to go to contact page 
    - Use bullet points for clarity when necessary
    - Avoid jargon unless the user is familiar with it
    
"""

def determine_response_length(user_message: str) -> dict:
    """
    Determine appropriate response parameters based on user message.
    Returns dict with max_tokens and instructions for the AI.
    """
    message_lower = user_message.lower()
    
    # Very short questions get short responses
    if len(user_message.split()) <= 3 or any(word in message_lower for word in ["yes", "no", "ok", "thanks", "thank you"]):
        return {
            "max_tokens": 150,
            "instruction": "Provide a very concise response (1-2 sentences maximum)."
        }
    
    # Questions about simple facts get medium responses
    elif any(word in message_lower for word in ["price", "cost", "when", "where", "how much", "do you", "have you"]):
        return {
            "max_tokens": 300,
            "instruction": "Provide a clear, factual response (3-5 sentences). Include only essential details."
        }
    
    # Complex questions get longer responses
    elif any(word in message_lower for word in ["explain", "describe", "why", "compare", "recommend", "help with"]):
        return {
            "max_tokens": 600,
            "instruction": "Provide a thorough response with clear structure. Use bullet points if helpful."
        }
    
    # Default to medium response
    return {
        "max_tokens": 400,
        "instruction": "Provide a helpful response of moderate length."
    }

def get_db_context(query: str) -> str:
    """
    Retrieve comprehensive context from MongoDB based on the query.
    Returns structured information to help the AI generate accurate responses.
    """
    context_parts = []
    query_lower = query.lower()
    
    # Product Information - Always check the database for products
    if any(keyword in query_lower for keyword in ["product", "item", "buy", "purchase", "price", "have", "sell", "offer"]):
        try:
            # Extract product-related keywords
            product_keywords = []
            for word in query_lower.split():
                if word not in ["product", "item", "buy", "purchase", "price", "have", "sell", "offer", "you", "do", "any"]:
                    product_keywords.append(word)
            
            # Search for matching products
            if product_keywords:
                products = list(db.products.find({
                    "$or": [
                        {"title": {"$regex": "|".join(product_keywords), "$options": "i"}},
                        {"description": {"$regex": "|".join(product_keywords), "$options": "i"}},
                        {"category": {"$regex": "|".join(product_keywords), "$options": "i"}}
                    ]
                }).limit(5))
            else:
                # If no specific product mentioned, get some featured products
                products = list(db.products.find().limit(3))
            
            if products:
                product_info = []
                for p in products:
                    product_info.append({
                        "name": p.get("title", "Unknown"),
                        "price": p.get("price", 0),
                        "category": p.get("category", "Uncategorized"),
                        "description": p.get("description", ""),
                        "in_stock": p.get("stock", 0) > 0
                    })
                context_parts.append(f"CURRENT_PRODUCTS: {json.dumps(product_info, cls=JSONEncoder)}")
            else:
                context_parts.append("CURRENT_PRODUCTS: No matching products found in database")
        except Exception as e:
            logger.error(f"Error fetching products: {e}")
            context_parts.append("PRODUCT_DATA_ERROR: Unable to access product database")

    # Payment method information
    if any(keyword in query_lower for keyword in ["payment", "pay", "method", "card", "credit", "paypal"]):
        context_parts.append("PAYMENT_METHODS: We accept Visa, Mastercard, and American Express credit/debit cards. We do not accept PayPal or other payment methods.")
    
    # Order Information
    if any(keyword in query_lower for keyword in ["order", "track", "delivery", "shipping"]):
        try:
            # Get order schema information
            order_schema = db.command("listCollections", filter={"name": "orders"})
            if order_schema:
                context_parts.append("ORDER_SCHEMA: Orders contain order_id, user_id, items[], shipping_address, payment_method, status, tracking_number, created_at")
        except Exception as e:
            logger.error(f"Error fetching order schema: {e}")

    return "\n".join(context_parts) if context_parts else "NO_RELEVANT_CONTEXT"

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat request with enhanced capabilities and return a human-like response.
    """
    try:
        # Validate Groq API key
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Chatbot service is currently unavailable"
            )
        
        # Extract the latest user message
        if not request.messages or len(request.messages) == 0:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "No messages provided"}
            )
        
        latest_user_message = next((m.content for m in reversed(request.messages) if m.role == "user"), None)
        
        if not latest_user_message:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "No user message found"}
            )
        
        # Get comprehensive database context
        db_context = get_db_context(latest_user_message)
        
        # Determine appropriate response length
        length_settings = determine_response_length(latest_user_message)
        
        # Prepare messages for Groq API with response length guidance
        groq_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": length_settings["instruction"]},
            {"role": "system", "content": f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M')}"}
        ]
        
        # Add database context if available
        if db_context and db_context != "NO_RELEVANT_CONTEXT":
            groq_messages.append({
                "role": "system", 
                "content": f"DATABASE_CONTEXT:\n{db_context}\nUse this EXACT information when responding about products, payments, or orders."
            })
        
        # Add conversation history
        for msg in request.messages[-6:]:
            groq_messages.append({"role": msg.role, "content": msg.content})
        
        # Call Groq API with dynamic length control
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama3-70b-8192",
            "messages": groq_messages,
            "max_tokens": length_settings["max_tokens"],
            "temperature": 0.7,
            "top_p": 0.9,
            "presence_penalty": 0.2,
            "frequency_penalty": 0.2
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                
                # Fallback strategy
                if "context length" in response.text.lower():
                    # Try with reduced context
                    payload["messages"] = payload["messages"][-3:]  # Last 3 messages only
                    payload["max_tokens"] = 512
                    retry_response = await client.post(GROQ_API_URL, json=payload, headers=headers)
                    
                    if retry_response.status_code == 200:
                        response_data = retry_response.json()
                        ai_response = response_data["choices"][0]["message"]["content"]
                    else:
                        ai_response = "I'm having trouble processing that request. Could you please rephrase or ask something else?"
                else:
                    ai_response = "I'm currently experiencing technical difficulties. Please try again in a few moments."
            else:
                response_data = response.json()
                ai_response = response_data["choices"][0]["message"]["content"]
        
        # Enhanced logging
        if request.user_id:
            try:
                log_entry = {
                    "user_id": request.user_id,
                    "timestamp": datetime.now(),
                    "user_message": latest_user_message,
                    "bot_response": ai_response,
                    "context_used": db_context if db_context != "NO_RELEVANT_CONTEXT" else None
                }
                db.chat_logs.insert_one(log_entry)
            except Exception as e:
                logger.error(f"Error logging chat: {e}")
        
        return ChatResponse(
            response=ai_response,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return ChatResponse(
            response="I apologize for the inconvenience. I'm currently unable to process your request. Our team has been notified. Please try again later or contact support for immediate assistance.",
            timestamp=datetime.now()
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the chatbot service.
    """
    return {"status": "healthy", "timestamp": datetime.now()}