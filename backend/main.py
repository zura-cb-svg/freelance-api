from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models
import auth
import jobs
import users
import chat

app = FastAPI(title="Freelance Marketplace API")

origins = [
    "http://localhost:5173",
    "https://freelance-dfs45cnlj-chakvetzura-6681.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(chat.router)