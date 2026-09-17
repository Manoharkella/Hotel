# 🏨 HostIQ — Next-Gen Hotel Marketplace & Lead Negotiation Platform

A full-stack, enterprise-grade hospitality platform featuring **reverse bidding, direct lead negotiation, credit-based lead unlocking, contactless QR check-in**, and a unified multi-portal architecture for **Customers, Hotel Partners, and Super Administrators**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Customer Portal](#1-customer-portal)
  - [Hotel Partner Portal](#2-hotel-partner-portal)
  - [Super Admin Portal](#3-super-admin-portal)
- [Architecture &amp; Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Clone / Open Repository](#1-clone--open-the-project)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Database Initialization &amp; Seeding](#3-database-initialization--seeding)
  - [4. Frontend Setup (React + Vite)](#4-frontend-setup-react--vite)
- [Complete Commands Cheat Sheet](#-complete-commands-cheat-sheet)
- [Demo Login Accounts](#-demo-login-accounts)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Environment Variables Reference](#-environment-variables-reference)
- [Troubleshooting &amp; FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview

**HostIQ** transforms traditional hotel booking into an active marketplace:

1. **Travelers** post their stay requirements (destination, dates, guest count, custom budget, and specific room preferences).
2. **Hotels** review the live leads inbox, unlock customer leads using platform credits, negotiate rates, and propose counter-offers via real-time messaging.
3. **Contactless Check-In**: Guests complete online check-in to receive an encrypted digital **QR Boarding Pass**, which hotels verify in seconds using an integrated web camera QR scanner.
4. **Super Admins** oversee the ecosystem through an interactive geographic map, approving hotels, tracking platform credit revenue, and monitoring booking transactions.

---

## ✨ Key Features

### 1. 🧳 Customer Portal

- **Hotel Discovery**: Filter and search approved hotels by city, price tier, room type, and luxury amenities.
- **Reverse Bidding (Post a Stay Lead)**: Specify budget, travel dates, and room preferences to receive bids directly from hoteliers.
- **Interactive Chat & Negotiation**: Real-time messaging with hoteliers to negotiate personalized prices.
- **Instant Booking**: Secure confirmation with automated reservation codes.
- **Online Pre-Check-In**: Enter guest identification details prior to arrival.
- **Digital QR Pass**: Instant visual boarding pass for lightning-fast, paperless front desk check-in.
- **Verified Reviews**: Post ratings and reviews after checkout.

### 2. 🏨 Hotel Partner Portal

- **Performance Dashboard**: Real-time visibility into active leads, booked revenue, total guests, and quotes.
- **Leads Inbox & Lead Unlocking**: Browse traveler inquiries; use wallet credits to unlock full guest contact info and engage.
- **Counter-Quoting & Chat**: Propose custom rates directly to prospective guests.
- **Credit Wallet System**: Recharge credits in bundles and monitor transparent debit/credit transaction history.
- **Bookings Management**: Track upcoming arrivals, confirmed stays, completed check-outs, and cancellations.
- **In-App Camera QR Scanner**: Built-in HTML5 camera scanner to validate guest QR boarding passes instantly.
- **Property & Room Manager**: Update hotel description, photos, geo-location, room categories, and pricing.

### 3. 🛡️ Super Admin Portal

- **Interactive Geo-Map (Leaflet)**: Visual map plotting all registered hotel locations with live status indicators.
- **Partner Verification**: One-click approval or suspension of hotel partner listings.
- **Guest & User Management**: Global user directory with status auditing and activity tracking.
- **Lead Oversight**: Platform-wide monitoring of all submitted travel inquiries and quotes.
- **Financial & Credit Ledger**: Auditing of all credit purchases, lead unlock fees, and revenue reports.
- **Configurable Settings**: Dynamic commission rules, credit costs per unlock, and platform policies.

---

## 🛠 Architecture & Tech Stack

```mermaid
graph TD
    Client["Frontend (React 18 + Vite)"]
    API["FastAPI Backend (Python 3.10+)"]
    DB[("Database (PostgreSQL / SQLite)")]

    Client -->|REST API & Polling| API
    API -->|SQLAlchemy ORM| DB
```

| Component              | Technology                           | Description                                                        |
| :--------------------- | :----------------------------------- | :----------------------------------------------------------------- |
| **Frontend Framework** | React 18 + Vite                      | High-performance SPA with fast HMR                                 |
| **Routing**            | React Router v7                      | Role-based protected routes (`/customer`, `/hotel`, `/admin`)      |
| **Styling**            | Vanilla CSS3                         | Custom luxury theme, dark sidebars, glassmorphism, responsive grid |
| **Icons & Maps**       | Lucide React, Leaflet, React-Leaflet | Modern iconography and interactive geospatial hotel mapping        |
| **QR Code Engine**     | `qrcode.react`, `html5-qrcode`       | Digital pass generation and live camera QR code scanner            |
| **Audio & Alerts**     | Web Audio API + HTML5 Notifications  | Dual-tone chime alerts and desktop notification integration        |
| **Backend API**        | FastAPI + Uvicorn                    | Async ASGI framework with OpenAPI autodocs (`/docs`)               |
| **Database ORM**       | SQLAlchemy                           | Unified ORM supporting PostgreSQL & SQLite                         |
| **Authentication**     | PyJWT + Bcrypt                       | Secure token-based auth with salted password hashing               |
| **Validation**         | Pydantic v2                          | Robust request/response schema modeling                            |

---

## 📂 Project Directory Structure

```text
Hotel/
├── backend/
│   ├── .env                       # Backend environment configuration (DB credentials)
│   ├── database.py                # SQLAlchemy engine & session setup (Postgres / SQLite fallback)
│   ├── main.py                    # FastAPI application, routes, and business logic
│   ├── models.py                  # Database ORM models (Users, Hotels, Leads, Bookings, etc.)
│   ├── schemas.py                 # Pydantic schemas for request & response validation
│   ├── requirements.txt           # Python dependencies
│   ├── seed_diverse_hotels.py     # Database seed script for hotels across major cities
│   ├── add_pg_customers.py        # Database seed script for demo customers and admin user
│   ├── reset_db.py                # Utility to wipe and reset transaction tables
│   ├── hotel.db                   # Local SQLite database fallback
│   └── vercel.json                # Vercel serverless deployment config
│
├── frontend/
│   ├── package.json               # Node dependencies & npm scripts
│   ├── index.html                 # Main HTML entry point
│   ├── src/
│   │   ├── main.jsx               # React DOM root entry
│   │   ├── App.jsx                # Application routing and role guard gates
│   │   ├── index.css              # Design system tokens and global styling
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Authentication & active session management
│   │   │   ├── AppContext.jsx     # Global marketplace state & notification handlers
│   │   │   └── ToastContext.jsx   # Toast notifications provider
│   │   ├── components/            # Reusable UI (ChatModal, NotificationListener, etc.)
│   │   ├── services/
│   │   │   └── api.js             # Centralized fetch API client with all backend endpoints
│   │   └── pages/
│   │       ├── AuthPage.jsx       # Unified Sign In / Sign Up with role switcher
│   │       ├── customer/          # Customer views (Search, Leads, Trips, QR Pass, etc.)
│   │       ├── hotel/             # Hotel partner views (Dashboard, Inbox, Scanner, Wallet)
│   │       └── admin/             # Admin views (Dashboard, Hotel Map, Users, Credits)
│   └── vercel.json                # Frontend SPA redirect configuration
│
├── migrate_to_local_postgres.py   # Cloud/Neon to local PostgreSQL migration utility
└── README.md                      # Project documentation and command guide
```

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: Version `18.x` or higher ([Download Node.js](https://nodejs.org/))
- **Python**: Version `3.10` to `3.12` ([Download Python](https://www.python.org/))
- **Git**: For version control
- _(Optional)_ **PostgreSQL**: Version 14+ if using a local PostgreSQL database instead of SQLite.

---

## 🚀 Quick Start Guide

### 1. Clone / Open the Project

Open your terminal or PowerShell in the root project folder:

```bash
cd c:\Hotel
```

---

### 2. Backend Setup (FastAPI)

#### A. Navigate to backend directory

```bash
cd backend
```

#### B. Create & Activate a Python Virtual Environment

- **On Windows (PowerShell):**

  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```

  _(If PowerShell displays an Execution Policy error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then re-run the activate command)_

- **On Windows (Command Prompt `cmd`):**

  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```

- **On macOS / Linux:**

  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### C. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Database Initialization & Seeding

The application automatically connects to **PostgreSQL** if `DATABASE_URL` is set in `backend/.env`, and smoothly falls back to **SQLite** (`hotel.db`) if not configured.

#### Seed Demo Data (Hotels, Users, and Admin)

Run the seeding scripts from inside the `backend` directory with the virtual environment activated:

```bash
# 1. Seed curated hotels across major cities (Hyderabad, Bangalore, etc.)
python seed_diverse_hotels.py

# 2. Seed demo customer accounts and the System Admin
python add_pg_customers.py
```

#### D. Start the Backend API Server

Run Uvicorn with automatic reload enabled on port **8000**:

```bash
uvicorn main:app --reload --port 8000
```

> **Backend is now live at:**
>
> - REST API: `http://localhost:8000`
> - Interactive OpenAPI Swagger UI Docs: `http://localhost:8000/docs`
> - Alternative ReDoc Documentation: `http://localhost:8000/redoc`

---

### 4. Frontend Setup (React + Vite)

Open a **new terminal window** (keep the backend running in the first terminal).

#### A. Navigate to the frontend directory

```bash
cd c:\Hotel\frontend
```

#### B. Install Frontend Dependencies

```bash
npm install
```

#### C. _(Optional)_ Configure Environment

By default, the frontend automatically routes API requests to `http://localhost:8000/api`. If you wish to customize this, create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api
```

#### D. Start the Frontend Development Server

```bash
npm run dev
```

> **Frontend application is now live at:**
>
> - Web App: `http://localhost:5173` (or the port indicated in terminal)

---

## ⚡ Complete Commands Cheat Sheet

### 🐍 Backend Terminal

| Task                              | PowerShell / Bash Command               |
| :-------------------------------- | :-------------------------------------- |
| Go to backend                     | `cd c:\Hotel\backend`                   |
| Create virtualenv                 | `python -m venv venv`                   |
| Activate virtualenv (Windows PS)  | `.\venv\Scripts\Activate.ps1`           |
| Activate virtualenv (Windows CMD) | `venv\Scripts\activate.bat`             |
| Activate virtualenv (Mac/Linux)   | `source venv/bin/activate`              |
| Install dependencies              | `pip install -r requirements.txt`       |
| Seed hotels & rooms               | `python seed_diverse_hotels.py`         |
| Seed users & admin                | `python add_pg_customers.py`            |
| Reset transaction tables          | `python reset_db.py`                    |
| **Start server (Dev)**            | `uvicorn main:app --reload --port 8000` |

---

### ⚛️ Frontend Terminal

| Task                     | PowerShell / Bash Command |
| :----------------------- | :------------------------ |
| Go to frontend           | `cd c:\Hotel\frontend`    |
| Install node modules     | `npm install`             |
| **Start dev server**     | `npm run dev`             |
| Build for production     | `npm run build`           |
| Preview production build | `npm run preview`         |

---

## 🔑 Demo Login Accounts

The database includes ready-to-use demo accounts for all three system roles:

| Role                      | Email             | Password | Dedicated Login URL                    | Access & Capabilities                                             |
| :------------------------ | :---------------- | :------- | :------------------------------------- | :---------------------------------------------------------------- |
| 🧳**Customer (Traveler)** | `arjun@gmail.com` | `arjun`  | `http://localhost:5173/customer_login` | Search hotels, post leads, counter-offers, QR pass, trips         |
| 🧳**Customer (Alt)**      | `priya@gmail.com` | `priya`  | `http://localhost:5173/customer_login` | Alternate guest account for testing multi-user chat               |
| 🏨**Hotel Partner**       | `HYD1@gmail.com`  | `HYD1`   | `http://localhost:5173/hotel_login`    | Partner dashboard, leads inbox, wallet, scanner, property manager |
| 🛡️**Super Admin**         | `admin@gmail.com` | `admin`  | `http://localhost:5173/admin_login`    | Full system control, map view, hotel approvals, credit audits     |

> 💡 **Tip**: Each portal has its own direct URL (`/customer_login`, `/hotel_login`, `/admin_login`). On each screen, you can also use the **1-Click Demo** button at the bottom of the card to instantly test and explore without typing credentials!

---

## 🌐 API Endpoints Overview

The backend exposes a comprehensive set of RESTful endpoints:

### Authentication & Profiles

- `POST /api/users/register` — Register a customer or manager account
- `POST /api/users/login` — Customer login & JWT issuance
- `POST /api/hotels/login` — Hotel manager login
- `POST /api/admin/login` — System administrator login
- `POST /api/hotels/register` — Register a new hotel with room inventory

### Leads & Negotiation

- `POST /api/leads` — Create a stay requirement lead (customer)
- `GET /api/leads/all` — List all active stay leads
- `POST /api/leads/unlock` — Unlock lead contact details using credits (hotel)
- `GET /api/leads/unlocked/{hotel_id}` — Get all leads unlocked by a hotel
- `POST /api/quotes` — Send an offer or counter-quote
- `GET /api/quotes/all` — Fetch all negotiation quotes
- `PUT /api/quotes/{id}/counter` — Counter an existing quote with new pricing

### Bookings & Check-In

- `POST /api/bookings` — Create a confirmed reservation
- `GET /api/bookings/all` — Retrieve all bookings
- `POST /api/bookings/scan` — QR Code scanner check-in verification
- `PUT /api/bookings/{id}/checkout` — Complete guest check-out
- `PUT /api/bookings/{id}/cancel` — Cancel reservation

### Wallet & Credits

- `GET /api/wallets/hotel/{hotel_id}` — Check hotel's credit balance
- `GET /api/wallets/hotel/{hotel_id}/transactions` — Hotel transaction history
- `POST /api/wallets/purchase` — Purchase credit packages (+100, +250, etc.)
- `GET /api/admin/transactions` — Platform-wide credit ledger (Admin)

### Admin Operations

- `GET /api/admin/hotels/all` — List all hotels including pending/suspended
- `PUT /api/admin/hotels/{id}/approve` — Approve a pending hotel partner
- `PUT /api/admin/hotels/{id}/suspend` — Suspend a hotel listing
- `GET /api/admin/users/all` — List all registered users

### Messaging & Reviews

- `POST /api/messages` — Send direct negotiation message
- `GET /api/messages/{lead_id}/{hotel_id}` — Fetch conversation history
- `POST /api/reviews` — Submit a hotel review & star rating
- `GET /api/reviews/hotel/{hotel_id}` — Fetch reviews for a specific hotel

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel
DB_USER=postgres
DB_PASSWORD=your_password_here

# Complete Database URL (Defaults to SQLite if omitted)
DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/hotel"
```

### Frontend (`frontend/.env` - optional)

```env
# Base API URL for backend calls
VITE_API_URL=http://localhost:8000/api
```

---

## ❓ Troubleshooting & FAQs

### 1. "Failed to fetch" or CORS Error in Frontend

- Ensure the backend server is running on `http://localhost:8000`.
- Verify that `main.py` has CORS enabled for `http://localhost:5173` (configured via `CORSMiddleware`).
- Check browser console (F12) to see if the request is hitting the correct port.

### 2. Camera QR Scanner Not Working

- Ensure you have granted **Camera permissions** to the browser.
- In Chrome/Firefox, camera access requires `localhost` or an `https://` origin.

### 3. Database Connection Issues

- If you do not have PostgreSQL installed, comment out or remove `DATABASE_URL` in `backend/.env`. The application will automatically create and use the local `hotel.db` SQLite database with zero external setup needed.

### 4. Port 8000 Already in Use

- Run on a different port:

  ```bash
  uvicorn main:app --reload --port 8080
  ```

  Then create `frontend/.env` and set:

  ```env
  VITE_API_URL=http://localhost:8080/api
  ```

---

## 📄 License

This project is open-source and available under the **MIT License**.
