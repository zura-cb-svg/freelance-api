from fastapi import FastAPI
from database import Base, engine
import models          # რეგისტრაცია Base.metadata-ზე
import auth
import jobs
import users
import chat

app = FastAPI(title="Freelance Marketplace API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(chat.router)