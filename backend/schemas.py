from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    client = "client"
    freelancer = "freelancer"


class ApplicationStatusEnum(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: RoleEnum

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: RoleEnum
    is_active: bool
    bio: Optional[str] = None
    skills: Optional[str] = None

    model_config = {"from_attributes": True} 



class JobCreate(BaseModel):
    title: str = Field(min_length=3, description="The title must contain at least 3 characters")
    description: str
    budget: int = Field(gt=0, description="The budget must be greater than zero")

class JobResponse(BaseModel):
    id: int
    title: str        
    description: str
    budget: int       
    owner_id: int
    owner: Optional[UserResponse] = None 

    model_config = {"from_attributes": True}

class ApplicationCreate(BaseModel):
    cover_letter: str
    proposed_price: int = Field(gt=0, description="The proposed price must be greater than zero")
    estimated_days: int = Field(gt=0, description="The estimated duration must be greater than zero")


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    freelancer_id: int
    cover_letter: str
    proposed_price: int
    estimated_days: int
    status: ApplicationStatusEnum

    model_config = {"from_attributes": True}

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatusEnum

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5, description="The rating must be between 1 and 5")
    comment: str

class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str
    reviewer_id: int
    target_user_id: int

    model_config = {"from_attributes": True}

