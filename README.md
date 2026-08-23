# AI-Powered Smart Pharmacy Availability Checker

A full-stack MCA mini project: a web application for real-time medicine availability, reservation, and AI-based stock demand prediction across nearby pharmacies.

**Tech stack (as per project plan):**
- **Frontend:** React.js, HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **AI / ML:** Python, Scikit-learn, Sentence-Transformers (NLP search), RapidFuzz
- **Auth:** JWT (JSON Web Tokens)
- **APIs:** RESTful APIs between all three tiers

## Architecture

```
User (Browser) → React.js Frontend → Node.js/Express Backend (REST + JWT) → MySQL Database
                                              ↕
                                     Python AI/ML Service (Flask)
                                     - NLP medicine search
                                     - Stock demand prediction
```

## Folder structure

```
smart-pharmacy/
├── database/schema.sql        MySQL schema + seed data
├── backend/                   Node.js + Express REST API
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js     JWT auth & role-based access
│   ├── controllers/           auth, medicine, pharmacy, reservation, admin
│   └── routes/
├── ai-service/                Python Flask AI/ML micro-service
│   ├── app.py
│   ├── nlp_search.py          Intelligent Medicine Search (NLP)
│   └── stock_prediction.py    Stock Demand Prediction (ML)
└── frontend/                  React single-page app
    └── src/
        ├── pages/              Login, Register, Search, Reservations,
        │                       Pharmacy Dashboard, Admin Dashboard
        ├── components/         Navbar, ProtectedRoute
        ├── context/AuthContext.js
        └── api/api.js
```

## Modules implemented (from the project plan)

| Module | What it does |
|---|---|
| **User Module** | Register/login (JWT), search medicines (AI/NLP), view availability & distance, reserve medicines, view reservations |
| **Pharmacy Module** | Manage medicines & stock, update price/quantity, view reservations, low-stock alerts, demand prediction |
| **Admin Module** | Manage users & pharmacies, verify pharmacies, system-wide monitoring dashboard |
| **AI & ML Module** | NLP-based intelligent search (typo/format tolerant), ML-based stock demand forecasting, automatic low-stock alerts |

## Setup instructions

### 1. Database (MySQL)
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend (Node.js/Express)
```bash
cd backend
npm install
cp .env.example .env      # edit DB credentials & JWT secret
npm run dev                # or: npm start
# API runs at http://localhost:5000
```

### 3. AI/ML service (Python/Flask)
```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Service runs at http://localhost:8000
```
> Note: the first run downloads the `all-MiniLM-L6-v2` sentence-transformer model (~90MB). If you're offline or want a lighter setup, the search still works using RapidFuzz fuzzy matching alone.

### 4. Frontend (React)
```bash
cd frontend
npm install
npm start
# App runs at http://localhost:3000
```

## Demo flow
1. Register as a **pharmacy** user → create a pharmacy profile → add stock for a few medicines.
2. Register as a **customer** → search for a medicine (try a typo, e.g. "paracitamol") → see nearby pharmacies sorted by distance → reserve one.
3. Log back in as the pharmacy → confirm the reservation → mark it ready → mark it picked up.
4. Add a few rows to `sales_history` (or use the "record a sale" endpoint) for a medicine, then use **Demand Prediction** to forecast the next 7 days and see the low-stock alert trigger automatically.
5. Register/promote a user to **admin** (set `role = 'admin'` directly in the `users` table for the first admin) to verify pharmacies and view system-wide stats.

## Notes for the project report
- Passwords are hashed with **bcrypt**; sessions are stateless via **JWT** (7-day expiry).
- Distance between the user and each pharmacy is computed with the **Haversine formula** on the backend.
- The AI/ML service blends **semantic similarity** (sentence embeddings) and **fuzzy string matching** so the search tolerates both typos and natural phrasing.
- Stock demand prediction uses a **linear regression** trend model over each pharmacy's sales history (`scikit-learn`), falling back to a moving average when there isn't enough data.
- If the AI/ML service is offline, the backend automatically falls back to a plain SQL `LIKE` search so the core app keeps working end-to-end.
