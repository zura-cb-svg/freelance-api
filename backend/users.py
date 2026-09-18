from fastapi import Depends, APIRouter, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from schemas import UserResponse, UserUpdate, JobResponse, ApplicationResponse, ReviewCreate, ReviewResponse
from database import get_db
from auth import get_current_user
from models import Job, Application, User, Review
from pathlib import Path
from uuid import uuid4



router = APIRouter(prefix="/users", tags=["Users"])


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update(user_data: UserUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.skills is not None:
        current_user.skills = user_data.skills
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/jobs", response_model=list[JobResponse])
def get_me_job(db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can view their jobs")
    return db.query(Job).filter(Job.owner_id == current_user.id).all()


@router.get("/me/applications", response_model=list[ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can view applications")
    applications = (
        db.query(Application)
        .filter(Application.freelancer_id == current_user.id)
        .all()
    )
    return applications


@router.post("/{target_user_id}/reviews", response_model=ReviewResponse)
def add_review(
    target_user_id: int, 
    review_data: ReviewCreate,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review yourself")

    new_review = Review(
        rating=review_data.rating,
        comment=review_data.comment,
        reviewer_id=current_user.id,
        target_user_id=target_user_id
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.post("/me/portfolio")
async def upload_portfolio(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if current_user.role != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can upload portfolios")

    original_name = Path(file.filename or "upload.bin").name
    file_location = UPLOAD_DIR / f"{current_user.id}_{uuid4().hex}_{original_name}"
    with file_location.open("wb") as file_object:
        file_object.write(await file.read())

    return {"message": "File uploaded successfully", "filename": file.filename}


@router.get("/{target_user_id}/reviews")
def get_user_reviews(target_user_id: int, db: Session = Depends(get_db)):
    user_reviews = db.query(Review).filter(Review.target_user_id == target_user_id).all()
    if not user_reviews:
        return {"average_rating": 0.0, "reviews": []}

    total_score = sum(review.rating for review in user_reviews)
    average = total_score / len(user_reviews)

    return {
        "average_rating": round(average, 1),
        "reviews": user_reviews
    }