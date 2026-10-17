# Milestone 2 — Task 1: Backend Foundation, Gemini Integration, Neon Database & Negotiation Arena UI

This document provides the complete technical documentation, architectural specifications, and step-by-step setup guides for **Milestone 2 — Task 1**.

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │   React 19 Frontend (Vite)             │
                      │   - Negotiation Arena UI               │
                      │   - Live Transcript & Real-Time Meters │
                      └──────────────────┬─────────────────────┘
                                         │ HTTP REST / Polling
                                         ▼
                      ┌────────────────────────────────────────┐
                      │   Node.js / Express Backend (Port 5000)│
                      │   - Simulation Session State Machine   │
                      │   - Turn Orchestration & Concessions   │
                      └──────────┬───────────────────┬─────────┘
                                 │                   │
         SQL Queries / pg Pool   │                   │ HTTP POST (/api/agent/respond)
                                 ▼                   ▼
      ┌────────────────────────────┐    ┌────────────────────────────────────────┐
      │ Neon PostgreSQL Database   │    │ Python / FastAPI AI Service (Port 8000)│
      │ - simulations              │    │ - Google Gemini API (gemini-2.5-flash) │
      │ - agents                   │    │ - Persona Reasoning & Concession Curves│
      │ - messages (transcript)    │    └────────────────────────────────────────┘
      │ - offers & agreements      │
      └────────────────────────────┘
```

---

## 2. Project Folder Structure

```
multi-agent-negotiation-simulator/
├── ai-service/                     # Python / FastAPI AI Service
│   ├── .env.example                # Gemini API key & port template
│   ├── main.py                     # FastAPI application & Gemini prompt handler
│   └── requirements.txt            # Python dependencies (fastapi, uvicorn, google-genai)
├── backend/                        # Node.js / Express Backend
│   ├── .env.example                # Neon DB URL & backend port template
│   ├── package.json
│   └── src/
│       ├── server.js               # Express app entry point
│       ├── controllers/
│       │   └── simulationController.js # Simulation lifecycle (start, step, pause, restart)
│       ├── db/
│       │   ├── db.js               # Neon PostgreSQL client with in-memory fallback
│       │   ├── init.sql            # Table schema definitions
│       │   └── migrate.js          # DB migration script
│       ├── routes/
│       │   └── simulationRoutes.js # REST API endpoints
│       └── services/
│           └── aiClient.js         # Client connecting Express to FastAPI
├── frontend/                       # React 19 Frontend
│   └── src/
│       ├── pages/
│       │   ├── NegotiationArena.jsx # Live Simulation Arena Component
│       │   └── NegotiationArena.css # Reference-accurate visual styling
│       └── services/
│           └── simulationApi.js     # Frontend API client
└── docs/
    └── milestone-2-task-1.md       # Integration guide & contracts
```

---

## 3. Database Schema (Neon PostgreSQL)

### Tables Created in `backend/src/db/init.sql`:
1. **`simulations`**: Stores simulation instances, current round, status (`RUNNING`, `PAUSED`, `COMPLETED`, `DEADLOCK`), current gap, and agreement likelihood.
2. **`agents`**: Stores participating agents, roles (Buyer/Seller), personality profiles, goals, target values, reservation values, and active offers.
3. **`messages`**: Full negotiation dialogue transcript with agent identity, round number, message text, and timestamp.
4. **`offers`**: Discrete numerical offers exchanged per round with decision statuses (`ACCEPTED`, `COUNTERED`, `REJECTED`).
5. **`agreements`**: Final agreed terms and settlement values upon successful negotiation completion.

---

## 4. How to Get a Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click on **"Create API Key"** (or **"Get API key"**).
4. Select or create a Google Cloud project when prompted.
5. Copy the generated API Key.
6. Open `ai-service/.env` and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeneratedGeminiKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   ```
7. *(Optional)* You can also paste it into `backend/.env` for direct reference.

---

## 5. How to Create and Connect Neon PostgreSQL Database

1. Go to [Neon.tech](https://neon.tech/) and sign up for a free account.
2. Click **"New Project"**.
3. Choose a project name (e.g., `negotiator-ai-db`) and select the region nearest to you.
4. Once the project is created, Neon will display your **Connection Details**.
5. Select the **"Node.js"** or **"Connection string"** tab and copy the connection URI:
   ```
   postgresql://alex:AbCd1234EfGh@ep-sweet-snow-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Open `backend/.env` and set your `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://alex:AbCd1234EfGh@ep-sweet-snow-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. Run the migration to automatically create all tables:
   ```bash
   cd backend
   npm run migrate
   ```
   *Note: If `DATABASE_URL` is empty, the backend automatically uses an In-Memory Store so development is never blocked.*

---

## 6. How to Run the Entire Stack

### Step 1: Start the Python FastAPI AI Service
```bash
cd ai-service
# On Windows powershell:
python main.py
# The AI service starts on http://localhost:8000
```

### Step 2: Start the Express Backend
```bash
cd backend
npm run dev
# The Express server starts on http://localhost:5000
```

### Step 3: Start the React Frontend
```bash
cd frontend
npm run dev
# The Vite development server starts on http://localhost:5173
```

Navigate to `http://localhost:5173/arena` to see the live Negotiation Arena!
