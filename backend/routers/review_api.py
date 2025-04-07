from fastapi import APIRouter, Body, HTTPException, Depends
from typing import List
from models.Review import ReviewModel, create_review, get_review, update_review, delete_review, list_reviews
from .users import get_current_user
from bson import ObjectId

router = APIRouter()

@router.post("/", response_description="Add new review")
async def add_review(review: ReviewModel = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        # Ensure the user is providing a review for a product
        if not review.product_id:
            raise HTTPException(status_code=400, detail="Product ID is required")

        # Set the user_id and user_name from the current user
        review.user_id = current_user["_id"]
        review.user_name = current_user["username"]
        review.user_avatar = current_user.get("avatar_url")  # Optional avatar URL

        review_id = create_review(review)
        return {"message": "Review added successfully", "review_id": review_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_description="Get a single review")
async def show_review(id: str):
    try:
        review = get_review(id)
        if review:
            return review
        raise HTTPException(status_code=404, detail=f"Review with id {id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_description="Update a review")
async def update_review_data(id: str, review: ReviewModel = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        existing_review = get_review(id)
        if not existing_review:
            raise HTTPException(status_code=404, detail=f"Review with id {id} not found")

        # Check if the current user is the author of the review
        if str(existing_review["user_id"]) != str(current_user["_id"]) and current_user["role"] != "superadmin":
            raise HTTPException(
                status_code=403, detail="Not authorized to update this review"
            )

        updated_review = update_review(id, review)
        if updated_review:
            return {"message": "Review updated successfully", "review": updated_review}
        raise HTTPException(status_code=404, detail=f"Review with id {id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}", response_description="Delete a review")
async def delete_review_data(id: str, current_user: dict = Depends(get_current_user)):
    try:
        existing_review = get_review(id)
        if not existing_review:
            raise HTTPException(status_code=404, detail=f"Review with id {id} not found")

        # Check if the current user is the author of the review or an admin
        if str(existing_review["user_id"]) != str(current_user["_id"]) and current_user["role"] != "superadmin":
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this review"
            )

        if delete_review(id):
            return {"message": "Review deleted successfully"}
        raise HTTPException(status_code=404, detail=f"Review with id {id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/product/{product_id}", response_description="List reviews for a product")
async def list_product_reviews(product_id: str):
    try:
        reviews = list_reviews(product_id)
        # Convert ObjectId to string
        for review in reviews:
            review["id"] = str(review.pop("_id"))
            if isinstance(review["user_id"], ObjectId):
                review["user_id"] = str(review["user_id"])
            if isinstance(review["product_id"], ObjectId):
                review["product_id"] = str(review["product_id"])
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

