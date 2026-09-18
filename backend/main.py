from fastapi import FastAPI
import auth
import jobs
import users
import chat
from database import engine
import models

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Freelance Marketplace API")
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(chat.router)