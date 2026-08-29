# 🏥 AI-Powered Smart Pharmacy Availability Checker

A modern full-stack web application for real-time medicine search, GPS distance sorting, 1-click reservations, automated low-stock tracking, and multi-agent AI demand forecasting.

---

## 🌟 Key Architecture & Frameworks

```
┌────────────────────────────────────────────────────────┐
│                   React.js Frontend                    │
│            (Port 3000 / Single Page App)               │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST & JWT
                            ▼
┌────────────────────────────────────────────────────────┐
│              Node.js + Express.js Backend              │
│                      (Port 5000)                       │
│    - Auth (JWT + bcryptjs)                             │
│    - Haversine Formula (GPS Distance Sorting)          │
│    - Inventory, Reservations & Admin APIs              │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼ (SQL Pool)               ▼ (HTTP / JSON)
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│   PostgreSQL / Neon Cloud    │  │   VoltAgent AI Microservice      │
│          Database            │  │          (Port 8000)             │
│ - Users & Roles              │  │ - OpenRouter Multi-LLM Support   │
│ - Pharmacies & Live Stock    │  │ - 3 Autonomous Agent Workers     │
│ - Reservations & Sales Logs  │  │ - Hono HTTP REST Compatibility   │
└──────────────────────────────┘  └──────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology & Tools | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js (v18)**, React Router 6, Axios | Modern, responsive UI with customized design system, animated spinners, role-based dashboards |
| **Backend** | **Node.js, Express.js** | RESTful API server, JWT authentication, authorization middleware, transactional queries |
| **Database** | **PostgreSQL (Neon Serverless Cloud)** | Relational DB with connection pooling (`pg`), ENUMs, foreign key cascades, sales logging |
| **AI / Agent Engine** | **VoltAgent (v2.10) + OpenRouter** | Multi-Agent AI system running LLMs with deterministic calculation tools for fuzzy matching & regression |
| **Styling** | **Custom CSS Tokens (`theme.css`)** | Custom medical teal palette, CSS micro-animations, `@keyframes spin` loaders |

---

## 🤖 AI Multi-Agent Architecture (VoltAgent)

The AI layer runs on **VoltAgent** (`@voltagent/core`) combined with **OpenRouter**:

1. **`MedicineSearchAgent`** ([searchAgent.ts](file:///c:/Users/02/Desktop/AI-Powered%20Smart%20Pharmacy/ai-service/src/agents/searchAgent.ts)):
   - Analyzes conversational or misspelled medicine queries (e.g., *"paracitamol"* or *"crocin"*).
   - Utilizes `fuzzyMatchTool` with Levenshtein distance calculation to accurately match against the pharmacy catalogue.
2. **`DemandPredictionAgent`** ([demandPredictionAgent.ts](file:///c:/Users/02/Desktop/AI-Powered%20Smart%20Pharmacy/ai-service/src/agents/demandPredictionAgent.ts)):
   - Analyzes historical daily sales records using `trendCalculatorTool` (linear regression, moving averages).
   - Predicts 7-day future demand and calculates dynamic safety stock thresholds.
3. **`PharmacyConsultantAgent`** ([pharmacyConsultantAgent.ts](file:///c:/Users/02/Desktop/AI-Powered%20Smart%20Pharmacy/ai-service/src/agents/pharmacyConsultantAgent.ts)):
   - Medical assistant for drug interactions, dosage precautions, and approved generic alternatives.

---

## 👥 Default Demo Credentials (1-Click Login Ready)

The Login page includes a **1-Click Demo Login selector** with pre-seeded accounts:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| 👤 **Customer** | `customer@pharmacy.com` | `password123` | Search medicines by name/typo, view GPS distance, reserve items with 24h pickup window |
| 🏥 **Pharmacy Owner** | `pharmacy@pharmacy.com` | `password123` | Manage inventory & prices, view low-stock alerts, run AI demand forecasting, manage reservations |
| 🛡️ **System Admin** | `admin@pharmacy.com` | `password123` | System overview stats, verify newly registered pharmacies, user management |

---

## 🚀 How to Run the Application

### 1. Database Setup (Neon PostgreSQL)
Ensure your `.env` in `backend/` and `database/` contains your Neon connection string:
```env
DATABASE_URL=postgresql://neondb_owner:npg_gY5y4krhcKvx@ep-rapid-firefly-a827v4t7-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
```
To run the automated schema migration & seed script:
```bash
node database/migrate.js
```

---

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
# Server runs at http://localhost:5000
```

---

### 3. AI Service Setup
```bash
cd ai-service
npm install
npm run dev
# VoltAgent runtime running at http://localhost:8000
```

---

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
# React app opens at http://localhost:3000
```

---

## 🔄 End-to-End How It Works (Demo Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant Frontend as 💻 React UI
    participant Backend as ⚙️ Express Backend (:5000)
    participant Database as 🗄️ Neon PostgreSQL
    participant AIService as 🤖 VoltAgent (:8000)
    actor Pharmacy as 🏥 Pharmacy Owner

    Customer->>Frontend: 1. Searches "paracitamol" (with typo)
    Frontend->>Backend: GET /api/medicines/search?query=paracitamol&lat=...&lng=...
    Backend->>Database: Fetch master catalogue names
    Backend->>AIService: POST /nlp-search { query, catalogue }
    AIService->>AIService: searchAgent calls fuzzy_match_calculator
    AIService-->>Backend: Matched IDs & confidence scores
    Backend->>Database: Query stock across all pharmacies
    Backend->>Backend: Calculate Haversine distance from customer coords
    Backend-->>Frontend: Display pharmacies sorted from closest to farthest
    Customer->>Frontend: 2. Click "Reserve"
    Frontend->>Backend: POST /api/reservations (JWT Auth)
    Backend->>Database: Create reservation & decrease stock
    Backend-->>Frontend: Confirmation with 24-hour pickup window

    Pharmacy->>Frontend: 3. Login as Pharmacy Owner
    Frontend->>Backend: GET /api/pharmacy/:id/predict/:medicineId
    Backend->>Database: Fetch sales_history records
    Backend->>AIService: POST /predict-demand { history }
    AIService->>AIService: demandPredictionAgent computes regression & trend
    AIService-->>Backend: 7-day forecast & reorder recommendation
    Backend-->>Frontend: Displays interactive forecasting card
```

---

## 📁 Repository Directory Structure

```
AI-Powered Smart Pharmacy/
├── backend/                       # Node.js + Express REST API Server
│   ├── config/db.js               # PostgreSQL connection pool with mysql-style compat
│   ├── controllers/               # Auth, Medicine, Pharmacy, Reservation, Admin
│   ├── middleware/auth.js         # JWT verification & role authorization
│   ├── routes/                    # API route declarations
│   └── server.js                  # App bootstrap on port 5000
│
├── ai-service/                    # VoltAgent Multi-Agent AI Microservice
│   ├── src/
│   │   ├── agents/                # searchAgent, demandPredictionAgent, pharmacyConsultantAgent
│   │   ├── tools/                 # searchTools (fuzzy match), predictionTools (trend calculator)
│   │   ├── config/openrouter.ts   # OpenRouter LLM configuration & provider bridge
│   │   ├── routes/compatRoutes.ts # Hono endpoints for /nlp-search, /predict-demand, /consult
│   │   └── index.ts               # VoltAgent + Hono server on port 8000
│
├── frontend/                      # React.js Single Page Application
│   ├── src/
│   │   ├── api/api.js             # Axios instance with JWT interceptors
│   │   ├── components/            # Navbar, ProtectedRoute, Spinner (animated loaders)
│   │   ├── context/AuthContext.js # Auth state, login/logout, user session persistence
│   │   ├── pages/                 # SearchMedicine, PharmacyDashboard, AdminDashboard, Login, Register, Reservations
│   │   └── styles/theme.css       # Custom design system with CSS animations & tokens
│
└── database/
    ├── schema.sql                 # Neon PostgreSQL schema definitions & seed queries
    └── migrate.js                 # Automatic DB migration runner
```
