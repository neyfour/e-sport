from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta , timezone 
from pydantic import BaseModel, Field, EmailStr
import jwt
from passlib.context import CryptContext
from bson import ObjectId
import os
from pymongo import MongoClient
from google.oauth2 import id_token
from google.auth.transport import requests
from dateutil.parser import parse 
import random
import string
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_mail.errors import ConnectionErrors

# Configure FastMail
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", " "),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", ""),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

mail = FastMail(conf)
from pydantic import EmailStr, BaseModel

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "2ca83451c4cfa6b46d3826319fec5fc877c946cec7ce0d0cdaf266fedb7d9ae1")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "290426604593-h3gdolqn5kl581sgq70nlgn3lrjffovu.apps.googleusercontent.com")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

# Models
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class SellerApplication(BaseModel):
    business_name: str
    business_type: str
    description: str
    address: str
    phone: str
    tax_id: Optional[str] = None

class SuspendUser(BaseModel):
    suspended_until: Optional[str] = None
    reason: Optional[str] = None


# Add these models to your existing models section
class RequestResetCode(BaseModel):
    email: EmailStr

class VerifyResetCode(BaseModel):
    email: EmailStr
    code: str

# Update the PasswordReset model to include verification code
class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str
    verification_code: str

# Add these models to your existing models section
class RequestPasswordReset(BaseModel):
    email: EmailStr

class VerifyPasswordReset(BaseModel):
    email: EmailStr
    token: str
    new_password: str
# Update the PasswordReset model to include verification code
class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str
    verification_code: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string
    user["_id"] = str(user["_id"])
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    # Add suspension check
    if "suspended_until" in current_user:
     if datetime.utcnow() < current_user["suspended_until"]:
        raise HTTPException(403, "...")
    else:
        # Auto-unsuspend
        db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$unset": {"suspended_until": "", "suspension_reason": ""}}
        )
    return current_user

# Routes
@router.post("/register", response_model=Token)
async def register_user(user: UserCreate):
    # Check if user already exists
    if db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "role": "customer",  # Default role
        "created_at": datetime.utcnow(),
        "balance": 0,  # Initial balance for sellers
        "is_active": True
    }
    
    result = db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Return user without password
    user_data["_id"] = user_id
    del user_data["hashed_password"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Suspension check with proper timezone handling
    if "suspended_until" in user: 
        suspended_until = parse(user["suspended_until"])
        # Make both datetimes timezone-aware or both naive
        if suspended_until.tzinfo is not None:
            # If suspended_until is timezone-aware, make now timezone-aware too
            now = datetime.now(timezone.utc)
        else:
            # If suspended_until is naive, make now naive too
            now = datetime.utcnow()
        
        if now < suspended_until:
            raise HTTPException(
                status_code=403,
                detail=f"Account suspended until {user['suspended_until']}"
            )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    # Return user without password
    user["_id"] = str(user["_id"])
    del user["hashed_password"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/google-login", response_model=Token)
async def google_login(google_data: GoogleLogin):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_data.token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        # Check if the token is valid
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer",
            )
        
        # Get user info from token
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Check if user exists
        user = db.users.find_one({"email": email})
        
        if not user:
            # Create new user
            user_data = {
                "email": email,
                "username": email.split('@')[0],
                "full_name": name,
                "role": "customer",  # Default role
                "created_at": datetime.utcnow(),
                "balance": 0,
                "is_active": True,
                "google_id": idinfo['sub']  # Store Google ID
            }
            
            result = db.users.insert_one(user_data)
            user_id = str(result.inserted_id)
            user_data["_id"] = user_id
        else:
            # Update existing user with Google ID if not present
            if 'google_id' not in user:
                db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_id": idinfo['sub']}}
                )
            
            user_id = str(user["_id"])
            
            # Remove hashed_password if exists
            if "hashed_password" in user:
                del user["hashed_password"]
            
            user["_id"] = user_id
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user if user else user_data
        }
        
    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

@router.get("/me", response_model=Dict[str, Any])
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/become-seller")
async def become_seller(
    application: SellerApplication,
    current_user: dict = Depends(get_current_user)
):
    # Check if user is already a seller
    if current_user["role"] == "seller":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a seller"
        )
    
    # Create seller application
    seller_application = {
        "user_id": current_user["_id"],
        "business_name": application.business_name,
        "business_type": application.business_type,
        "description": application.description,
        "address": application.address,
        "phone": application.phone,
        "tax_id": application.tax_id,
        "status": "pending",  # pending, approved, rejected
        "created_at": datetime.utcnow()
    }
    
    db.seller_applications.insert_one(seller_application)
    
    # Create notification for superadmin
    notification = {
        "user_id": None,  # For superadmin
        "type": "seller_application",
        "title": "New Seller Application",
        "message": f"User {current_user['username']} has applied to become a seller",
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    db.notifications.insert_one(notification)
    
    return {"message": "Your seller application has been submitted for review"}

@router.get("/sellers", response_model=List[Dict[str, Any]])
async def get_sellers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")

    sellers = list(db.users.find({"role": "seller"}))
    
    for seller in sellers:
        seller["_id"] = str(seller["_id"])
        if "hashed_password" in seller:
            del seller["hashed_password"]

        seller_id_str = seller["_id"]

        # PRODUCTS COUNT
        seller["total_products"] = db.products.count_documents({
            "seller_id": ObjectId(seller["_id"])
        })

        # ORDERS AND SALES - UPDATED TO MATCH "delivered" STATUS
        pipeline = [
            {"$match": {
                "items.seller_id": seller_id_str,
                "status": "delivered",  # Changed from "completed" to "delivered"
                "payment_status": "paid"
            }},
            {"$unwind": "$items"},
            {"$match": {"items.seller_id": seller_id_str}},
            {"$group": {
                "_id": None,
                "total_sales": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "total_orders": {"$addToSet": "$_id"}
            }},
            {"$project": {
                "total_sales": 1,
                "total_orders": {"$size": "$total_orders"}
            }}
        ]
        
        order_stats = list(db.orders.aggregate(pipeline))
        if order_stats:
            seller["total_sales"] = order_stats[0]["total_sales"]
            seller["total_orders"] = order_stats[0]["total_orders"]
        else:
            seller["total_sales"] = 0
            seller["total_orders"] = 0

    return sellers

@router.delete("/{seller_id}")
async def delete_seller(
    seller_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Only superadmin can delete sellers
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete sellers"
        )

    # Check if seller exists
    seller = db.users.find_one({"_id": ObjectId(seller_id)})
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )

    # Delete seller
    db.users.delete_one({"_id": ObjectId(seller_id)})

    return {"message": "Seller deleted successfully"}

@router.get("/seller-applications", response_model=List[Dict[str, Any]])
async def get_seller_applications(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None
):
    # Only superadmin can view seller applications
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view seller applications"
        )
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    
    applications = list(db.seller_applications.find(query).sort("created_at", -1))
    
    # Convert ObjectId to string
    for app in applications:
        app["_id"] = str(app["_id"])
        
        # Get user details
        user = db.users.find_one({"_id": ObjectId(app["user_id"])})
        if user:
            app["user"] = {
                "_id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "full_name": user.get("full_name")
            }
    
    return applications

@router.put("/seller-applications/{application_id}/status")
async def update_application_status(
  application_id: str,
  status_data: Dict[str, str],
  current_user: dict = Depends(get_current_user)
):
  # Only admin and superadmin can update application status
  if current_user["role"] not in ["admin", "superadmin"]:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not authorized to update application status"
      )
  
  new_status = status_data.get("status")
  if new_status not in ["approved", "rejected", "pending"]:
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="Invalid status"
      )
  
  # Get application
  application = db.seller_applications.find_one({"_id": ObjectId(application_id)})
  if not application:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="Application not found"
      )
  
  # Update application status
  db.seller_applications.update_one(
      {"_id": ObjectId(application_id)},
      {
          "$set": {
              "status": new_status,
              "updated_at": datetime.utcnow(),
              "updated_by": current_user["_id"],
              "reason": status_data.get("reason", "")
          }
      }
  )
  
  # If approved, update user role to seller
  if new_status == "approved":
      db.users.update_one(
          {"_id": ObjectId(application["user_id"])},
          {"$set": {"role": "seller"}}
      )
  
  # Create notification for the user
  notification = {
      "user_id": application["user_id"],
      "type": "application_status",
      "title": "Seller Application Update",
      "message": f"Your seller application has been {new_status}",
      "read": False,
      "created_at": datetime.utcnow(),
      "data": {
          "application_id": application_id,
          "status": new_status
      }
  }
  
  db.notifications.insert_one(notification)
  
  return {"message": f"Application status updated to {new_status}"}

@router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    unread_only: bool = False
):
    # Build query
    query = {}
    
    if current_user["role"] == "superadmin":
        # Superadmin can mark all superadmin notifications as read
        query["$or"] = [
            {"user_id": current_user["_id"]},
            {"user_id": None}
        ]
    else:
        # Regular users only mark their own notifications as read
        query["user_id"] = current_user["_id"]
    
    if unread_only:
        query["read"] = False
    
    # Get notifications
    notifications = list(
        db.notifications.find(query)
        .sort("created_at", -1)
        .limit(50)
    )
    
    # Convert ObjectId to string
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
        if notification["user_id"]:
            notification["user_id"] = str(notification["user_id"])
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Get notification
    notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user has permission to mark this notification as read
    if notification["user_id"] and notification["user_id"] != current_user["_id"] and current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this notification as read"
        )
    
    # Mark as read
    db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

# New endpoints for suspending and unsuspending sellers
@router.put("/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    suspend_data: SuspendUser,
    current_user: dict = Depends(get_current_user)
):
    # Only superadmin can suspend users
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to suspend users"
        )
    
    # Check if user exists
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    suspended_until = parse(suspend_data.suspended_until)
    if suspended_until.tzinfo is None:
        suspended_until = suspended_until.replace(tzinfo=timezone.utc)
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "suspended_until": suspended_until.isoformat(),  # Store as ISO format string
            "suspension_reason": suspend_data.reason
        }}
    )
    
    # Create notification for the user
    notification = {
        "user_id": user_id,
        "type": "account_suspension",
        "title": "Account Suspended",
        "message": f"Your account has been suspended until {suspend_data.suspended_until}",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "suspended_until": suspend_data.suspended_until,
            "reason": suspend_data.reason
        }
    }
    
    db.notifications.insert_one(notification)
    
    return {"message": "User suspended successfully"}

@router.put("/{user_id}/unsuspend")
async def unsuspend_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Only superadmin can unsuspend users
    if current_user["role"] != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to unsuspend users"
        )
    
    # Check if user exists
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is suspended
    if "suspended_until" not in user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not suspended"
        )
    
    # Remove suspension
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$unset": {
            "suspended_until": "",
            "suspension_reason": ""
        }}
    )
    
    # Create notification for the user
    notification = {
        "user_id": user_id,
        "type": "account_unsuspension",
        "title": "Account Unsuspended",
        "message": "Your account has been unsuspended and is now active",
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    db.notifications.insert_one(notification)
    
    return {"message": "User unsuspended successfully"}



@router.post("/request-reset-code")
async def request_reset_code(reset_data: RequestResetCode):
    try:
        # Check if user exists
        user = db.users.find_one({"email": reset_data.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User with this email not found"
            )
        
        # Generate a random 4-digit code
        code = ''.join(random.choices(string.digits, k=4))
        
        # Store the code in the database with expiration time (15 minutes)
        expiration = datetime.utcnow() + timedelta(minutes=15)
        
        # Update or insert reset code - Make sure the collection exists
        db.password_reset_codes.update_one(
            {"email": reset_data.email},
            {
                "$set": {
                    "code": code,
                    "expires_at": expiration
                }
            },
            upsert=True
        )
        
        # Print the code for debugging
        print(f"Password reset code for {reset_data.email}: {code}")
        
        # Create the email content
        email_subject = "Password Reset Verification Code"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #4f46e5; text-align: center;">Password Reset Verification</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Please use the following verification code to complete the process:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 24px; font-weight: bold; letter-spacing: 8px; padding: 15px; background-color: #f3f4f6; border-radius: 5px; display: inline-block;">
                        {code}
                    </div>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Thank you,<br>Your E-SPORTS Team</p>
            </div>
        </body>
        </html>
        """
        
        # Create the message
        message = MessageSchema(
            subject=email_subject,
            recipients=[reset_data.email],
            body=email_body,
            subtype="html"
        )
        
        # Send the email
        await mail.send_message(message)
        
        return {"message": "Verification code sent to your email"}
    
    except ConnectionErrors as e:
        print(f"Failed to send email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )
    except Exception as e:
        print(f"Unexpected error in request_reset_code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset):
    try:
        # Check if user exists
        user = db.users.find_one({"email": reset_data.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User with this email not found"
            )
        
        # Verify the code
        reset_record = db.password_reset_codes.find_one({"email": reset_data.email})
        
        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code requested for this email"
            )
        
        # Check if code has expired
        if datetime.utcnow() > reset_record["expires_at"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one."
            )
        
        # Check if code matches
        if reset_record["code"] != reset_data.verification_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        # Hash the new password
        hashed_password = get_password_hash(reset_data.new_password)
        
        # Update the user's password
        result = db.users.update_one(
            {"email": reset_data.email},
            {"$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
        
        # Delete the used verification code
        db.password_reset_codes.delete_one({"email": reset_data.email})
        
        return {"message": "Password has been reset successfully"}
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        print(f"Unexpected error in reset_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


