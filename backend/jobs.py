from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Job, Application
from schemas import JobCreate, JobResponse, ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate
from auth import get_current_user
from sqlalchemy.orm import Session
from typing import Optional

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse)
def addjob(job_data: JobCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can create jobs")
    new_job = Job(
        title=job_data.title,
        description=job_data.description,
        budget=job_data.budget,
        owner_id=current_user.id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/", response_model=list[JobResponse])
def get_all_jobs(
    db: Session = Depends(get_db), 
    search: Optional[str] = None, 
    min_budget: Optional[int] = None, 
    max_budget: Optional[int] = None,
    limit: int = 10,
    offset: int = 0
):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must not be negative")

    query = db.query(Job)
    
    if min_budget is not None:
        query = query.filter(Job.budget >= min_budget)
    if max_budget is not None:
        query = query.filter(Job.budget <= max_budget)
    if search is not None:
        query = query.filter(Job.title.ilike(f"%{search}%"))
        
    
    jobs = query.offset(offset).limit(limit).all()
    return jobs

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
    db.delete(job)
    db.commit()
    return {"message": "Job successfully deleted"}

@router.put("/{id}", response_model=JobResponse)
def update(id: int, job_data: JobCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to update this job")
    job.title = job_data.title
    job.description = job_data.description
    job.budget = job_data.budget
    db.commit()
    db.refresh(job)
    return job

@router.post("/{job_id}/applications", response_model=ApplicationResponse)
def apply_for_job(job_id: int, application_data: ApplicationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can apply")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="job not found")

    application = Application(
        job_id=job_id,
        freelancer_id=current_user.id,
        cover_letter=application_data.cover_letter,
        proposed_price=application_data.proposed_price,
        estimated_days=application_data.estimated_days,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/{job_id}/applications", response_model=list[ApplicationResponse])
def get_job_applications(job_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")
    return job.applications



@router.patch("/applications/{application_id}/status", response_model=ApplicationResponse)
def patch(application_id: int, status_data: ApplicationStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="application not found")
    if application.job.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")

    application.status = status_data.status
    db.commit()
    db.refresh(application)
    return application