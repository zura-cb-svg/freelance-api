# Full-Stack Freelance Marketplace

![Live Status](https://img.shields.io/badge/Status-Live-success)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20PostgreSQL-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20AI%20Generated-purple)

## 🌐 Live Links
- **Live Website:** https://freelance-dfs45cnlj-chakvetzura-6681.vercel.app
- **Backend API (Swagger UI):** https://freelance-api-g8gh.onrender.com/docs

## 🔐 Demo Account (Try it out!)
You can test the platform's functionality without registering by using these demo credentials:
- **Email:** `demo@test.com`
- **Password:** `demo1234`

*(Note: Please ensure you create this account on your live site first!)*

## 👨‍💻 Developer's Note: My Role in this Project
My primary focus and expertise is **Backend Development**. 
- **Backend (Built by me):** I designed and built the entire REST API using Python, FastAPI, and PostgreSQL. I implemented JWT authentication, relational database models using SQLAlchemy, robust data validation with Pydantic, and handled the full deployment pipeline on Render.
- **Frontend (AI Generated):** To bring this API to life and present a fully functional product, I used AI to generate the React/Vite frontend. This allowed me to test real-world CORS configurations, frontend-backend API integrations, and full-stack deployment without deviating from my core backend focus.

## 🛠️ Tech Stack
**Backend (Core Focus)**
- Python 3
- FastAPI
- PostgreSQL & SQLAlchemy (ORM)
- Pydantic
- PyJWT & Bcrypt (Security)

**Frontend**
- React & Vite (AI Generated)
- Axios & Tailwind CSS
- Hosted on Vercel

## ⚙️ Core Backend Features
- Secure User Authentication (Register/Login with JWT)
- Job Posting & Management endpoints
- Relational Database structure with One-to-Many relationships
- Environment variable management and CORS protection

## Local Development Setup

This project uses Docker for the backend and database environment.

1. Make sure Docker Desktop is running.
2. Run the backend and database:
   ```bash
   docker compose up --build