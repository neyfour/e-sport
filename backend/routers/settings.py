from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, List, Dict, Any
import bcrypt
import os
import secrets
import shutil
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field

# Fix the import paths to avoid relative imports beyond top-level package
from routers.users import get_current_user
# Create models directly in this file to avoid circular imports
from pydantic import BaseModel, EmailStr

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]
users_collection = db["users"]
products_collection = db["products"]
orders_collection = db["orders"]
carts_collection = db["carts"]
wishlists_collection = db["wishlists"]
verification_codes_collection = db["verification_codes"]

# Define user models here to avoid circular imports
class UserRole:
    CUSTOMER = "customer"
    SELLER = "seller"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    current_password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    role: str = UserRole.CUSTOMER
    created_at: datetime
    updated_at: Optional[datetime] = None
    email_verified: bool = False
    avatar_url: Optional[str] = None
    balance: float = 0.0
    is_active: bool = True

class User(UserBase):
    id: str
    role: str = UserRole.CUSTOMER
    created_at: datetime
    updated_at: Optional[datetime] = None
    email_verified: bool = False
    avatar_url: Optional[str] = None
    balance: float = 0.0
    is_active: bool = True

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class DeleteAccount(BaseModel):
    password: str
    confirmation: bool = False

class EmailVerification(BaseModel):
    code: str

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

@router.get("/profile", response_model=User)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile information"""
    # Convert the dict to User model
    return User(
        id=current_user["_id"],
        email=current_user["email"],
        username=current_user["username"],
        full_name=current_user.get("full_name"),
        role=current_user.get("role", UserRole.CUSTOMER),
        created_at=current_user.get("created_at", datetime.now()),
        updated_at=current_user.get("updated_at"),
        email_verified=current_user.get("email_verified", False),
        avatar_url=current_user.get("avatar_url"),
        balance=current_user.get("balance", 0.0),
        is_active=current_user.get("is_active", True)
    )

@router.put("/profile", response_model=Dict[str, Any])
async def update_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    # Verify current password
    stored_user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not stored_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Fix the bcrypt password checking
    try:
        # Ensure the stored password is bytes
        hashed_password = stored_user["hashed_password"]
        if isinstance(hashed_password, str):
            # If it's stored as a string, convert it to bytes
            hashed_password = hashed_password.encode('utf-8')
        
        # Check the password
        if not bcrypt.checkpw(user_update.current_password.encode('utf-8'), hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
    except TypeError as e:
        # Handle encoding errors
        print(f"Password checking error: {e}")
        print(f"Password type: {type(stored_user['hashed_password'])}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying password. Please contact support."
        )
    
    # Prepare update data
    update_data = user_update.dict(exclude={"current_password"})
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    # Check if email is being changed
    if "email" in update_data and update_data["email"] != stored_user["email"]:
        # Check if email already exists
        if users_collection.find_one({"email": update_data["email"]}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate verification code
        verification_code = secrets.token_hex(3).upper()  # 6-character code
        
        # Store verification code
        verification_codes_collection.insert_one({
            "user_id": str(current_user["_id"]),
            "email": update_data["email"],
            "code": verification_code,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(hours=24)
        })
        
        # Mark email as unverified
        update_data["email_verified"] = False
        
        # In a real application, you would send an email with the verification code
        # For demo purposes, we'll print it to the console
        print(f"Verification code for {update_data['email']}: {verification_code}")
    
    # Update user in database
    users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$set": {
                **update_data,
                "updated_at": datetime.now()
            }
        }
    )
    
    # Return updated user
    updated_user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    
    # Convert ObjectId to string to make it serializable
    result = {}
    for key, value in updated_user.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        else:
            result[key] = value
    
    return result

@router.post("/verify-email", response_model=Dict)
async def verify_email(
    verification: EmailVerification,
    current_user: dict = Depends(get_current_user)
):
    """Verify email with code"""
    # Find verification code
    verification_record = verification_codes_collection.find_one({
        "user_id": str(current_user["_id"]),
        "code": verification.code,
        "expires_at": {"$gt": datetime.now()}
    })
    
    if not verification_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Mark email as verified
    users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"email_verified": True}}
    )
    
    # Delete verification code
    verification_codes_collection.delete_one({"_id": verification_record["_id"]})
    
    return {"message": "Email verified successfully"}

@router.put("/password", response_model=Dict)
async def change_password(
    password_update: PasswordUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    # Get stored user
    stored_user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not stored_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Fix the bcrypt password checking
    try:
        # Ensure the stored password is bytes
        hashed_password = stored_user["hashed_password"]
        if isinstance(hashed_password, str):
            # If it's stored as a string, convert it to bytes
            hashed_password = hashed_password.encode('utf-8')
        
        # Check the password
        if not bcrypt.checkpw(password_update.current_password.encode('utf-8'), hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
    except TypeError as e:
        # Handle encoding errors
        print(f"Password checking error: {e}")
        print(f"Password type: {type(stored_user['hashed_password'])}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying password. Please contact support."
        )
    
    # Validate new password
    if len(password_update.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Hash new password
    hashed_password = bcrypt.hashpw(password_update.new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update password in database
    users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$set": {
                "hashed_password": hashed_password,
                "updated_at": datetime.now()
            }
        }
    )
    
    return {"message": "Password updated successfully"}

@router.post("/profile-picture", response_model=Dict)
async def update_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Update user profile picture"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and GIF images are allowed"
        )
    
    # Create directory if it doesn't exist
    upload_dir = os.path.join("static", "images", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{current_user['_id']}_{secrets.token_hex(8)}.{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user profile picture
    avatar_url = f"/static/images/profiles/{unique_filename}"
    
    # Get the base URL from the request or use a configured base URL
    # This ensures the frontend gets a complete URL
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    full_avatar_url = f"{base_url}{avatar_url}"
    
    users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$set": {
                "avatar_url": avatar_url,
                "updated_at": datetime.now()
            }
        }
    )
    
    # Return both the relative path (stored in DB) and full URL (for immediate use)
    return {
        "message": "Profile picture updated successfully", 
        "avatar_url": avatar_url,
        "full_avatar_url": full_avatar_url
    }

@router.delete("/account", response_model=Dict)
async def delete_account(
    delete_data: DeleteAccount,
    current_user: dict = Depends(get_current_user)
):
    """Delete user account"""
    # Verify confirmation
    if not delete_data.confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion must be confirmed"
        )
    
    # Get stored user
    stored_user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not stored_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Fix the bcrypt password checking
    try:
        # Ensure the stored password is bytes
        hashed_password = stored_user["hashed_password"]
        if isinstance(hashed_password, str):
            # If it's stored as a string, convert it to bytes
            hashed_password = hashed_password.encode('utf-8')
        
        # Check the password
        if not bcrypt.checkpw(delete_data.password.encode('utf-8'), hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
    except TypeError as e:
        # Handle encoding errors
        print(f"Password checking error: {e}")
        print(f"Password type: {type(stored_user['hashed_password'])}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying password. Please contact support."
        )
    
    # Special handling for seller accounts
    if stored_user.get("role") == "seller":
        # Delete all seller's products
        products_collection.delete_many({"seller_id": str(current_user["_id"])})
        
        # Log seller deletion for audit purposes
        print(f"Seller {current_user['_id']} deleted with all products")
    
    # Delete user's cart
    carts_collection.delete_one({"user_id": str(current_user["_id"])})
    
    # Delete user's wishlist
    wishlists_collection.delete_one({"user_id": str(current_user["_id"])})
    
    # Mark orders as belonging to a deleted user (for record keeping)
    orders_collection.update_many(
        {"user_id": str(current_user["_id"])},
        {
            "$set": {
                "user_deleted": True, 
                "deletion_date": datetime.now()
            }
        }
    )
    
    # Delete user account
    users_collection.delete_one({"_id": ObjectId(current_user["_id"])})
    
    return {"message": "Account deleted successfully"}

