from pymongo import MongoClient
from bson.objectid import ObjectId
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

# MongoDB connection settings
MONGO_URI = "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client.get_default_database()

class ReviewModel(BaseModel):
    product_id: str = Field(...)
    user_id: str = Field(...)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_name: str = Field(...)
    user_avatar: Optional[str] = Field(None) 

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

        schema_extra = {
            "example": {
                "product_id": "60c5b9c3b4e1e9c4c8a7d0a1",
                "user_id": "60c5b9c3b4e1e9c4c8a7d0b2",
                "rating": 5,
                "comment": "This product is amazing!",
                "user_name": "John Doe",
                "user_avatar": "url_to_avatar",
            }
        }

def create_review(review: ReviewModel):
    review_dict = review.dict()
    result = db.reviews.insert_one(review_dict)
    return str(result.inserted_id)

def get_review(id: str):
    review = db.reviews.find_one({"_id": ObjectId(id)})
    return review

def update_review(id: str, review: ReviewModel):
    db.reviews.update_one({"_id": ObjectId(id)}, {"$set": review.dict()})
    return get_review(id)

def delete_review(id: str):
    db.reviews.delete_one({"_id": ObjectId(id)})
    return True

def list_reviews(product_id: str):
    reviews = list(db.reviews.find({"product_id": product_id}))
    return reviews

