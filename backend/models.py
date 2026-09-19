from sqlalchemy import String, Integer, Column, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from schemas import RoleEnum, ApplicationStatusEnum

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    full_name = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum))
    is_active = Column(Boolean, default=True)
    bio = Column(String)
    skills = Column(String)
    
    jobs = relationship("Job", back_populates="owner")
    applications = relationship("Application", back_populates="freelancer")
    written_reviews = relationship(
        "Review", foreign_keys="Review.reviewer_id", back_populates="reviewer"
    )
    received_reviews = relationship(
        "Review", foreign_keys="Review.target_user_id", back_populates="target_user"
    )

    
class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)
    budget = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cover_letter = Column(String)
    proposed_price = Column(Integer)
    estimated_days = Column(Integer)
    status = Column(Enum(ApplicationStatusEnum), default=ApplicationStatusEnum.pending)

    job = relationship("Job", back_populates="applications")
    freelancer = relationship("User", back_populates="applications")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    rating = Column(Integer)
    comment = Column(String)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    reviewer = relationship(
        "User", foreign_keys=[reviewer_id], back_populates="written_reviews"
    )
    target_user = relationship(
        "User", foreign_keys=[target_user_id], back_populates="received_reviews"
    )

class Message(Base):
    __tablename__ = "chat_messages" # 👈 მხოლოდ ეს სახელი შევცვალეთ
    id = Column(Integer, primary_key=True)
    content = Column(String)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)