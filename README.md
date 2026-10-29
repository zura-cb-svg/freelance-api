# Forge — Freelance Marketplace

A personal backend portfolio project built with Python, FastAPI, PostgreSQL and SQLAlchemy. Clients can post jobs, freelancers can apply, and users can exchange messages.

- [Live demo](https://freelance-api-phi.vercel.app/)
- [API documentation](https://freelance-api-g8gh.onrender.com/docs)

The frontend is generated with AI using React and Vite. My learning focus is the backend and API integration. This is a portfolio demo, with example listings; it is not a commercial marketplace. Please do not enter sensitive information.

## Features

- JWT login and hashed passwords
- Client and freelancer roles
- Job CRUD with ownership checks
- Keyword and budget filters, pagination
- Applications and application status updates
- Authenticated WebSocket chat, typing indicators and read receipts
- Private inbox and conversation history restricted to the signed-in user

## Stack

Backend: Python, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, python-jose, Passlib/bcrypt.

Frontend: React, Vite, Axios and Tailwind CSS. Hosting: Render (API) and Vercel (frontend).

## Local development

1. Create a Python 3.12 virtual environment and install `backend/requirements.txt`.
2. Copy `backend/.env.example` to `backend/.env`. Set your own database URL and a random secret key. Never commit real credentials.
3. From `backend`, run `uvicorn main:app --reload --port 8000`.
4. In `frontend`, run `npm ci`. Set `VITE_API_URL=http://localhost:8000` in an untracked `.env.local`, then run `npm run dev`.

The API creates its tables on startup. A PostgreSQL server must be available at your configured database URL.

## Checks

```bash
# In the Python virtual environment
pip install pytest httpx
python -m pytest backend/test_chat.py -q

# Frontend production build
cd frontend
npm run build
```

Chat tests use isolated SQLite data and cover authorization, impersonation prevention, input validation, message persistence and read status. They do not access the deployed database.

## Demo notes

The free API service can take time to wake after inactivity. The frontend allows a longer timeout and retries failed read requests once. The chat connection manager runs in one server process; multiple API workers would need shared messaging infrastructure.

A chat socket authenticates with a JWT in its first frame. The token is not included in the WebSocket URL. Existing sessions must log in again after a signing-key rotation.
