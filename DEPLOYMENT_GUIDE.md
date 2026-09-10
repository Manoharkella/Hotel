# 🚀 Free Vercel Deployment Guide (Step-by-Step)

This guide walks you through deploying your **HostIQ** platform on Vercel for free in two easy steps:
1. **Deploy Backend (FastAPI + Neon PostgreSQL)** → Get backend URL.
2. **Deploy Frontend (React + Vite)** → Connect to backend URL.

---

## 🔹 STEP 1: Deploy the Backend to Vercel

1. **Push your code to GitHub** (if not already pushed):
   ```bash
   git add .
   git commit -m "Configure Vercel deployment and Neon DB"
   git push origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/new)** and click **"Add New Project"** → Import your Git repository.

3. **Configure Project Settings for Backend**:
   - **Project Name**: `hostiq-backend` (or any name you like)
   - **Root Directory**: Click **Edit** and select `backend` 📁
   - **Framework Preset**: `Other`

4. **Add Environment Variable**:
   Under **Environment Variables**, add:
   - **Key**: `DATABASE_URL`
   - **Value**:
     ```
     postgresql://neondb_owner:npg_yRKaHcni5mu9@ep-super-fire-axa0qmum-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```

5. **Click "Deploy"** 🚀
   - Once deployed, Vercel gives you your backend URL, for example:
     `https://hostiq-backend-xxx.vercel.app`
   - Test it by opening `https://hostiq-backend-xxx.vercel.app/` in your browser. It will return:
     ```json
     { "status": "online", "service": "HostIQ Hotel Platform API", "database": "Neon PostgreSQL Connected" }
     ```

---

## 🔹 STEP 2: Deploy the Frontend to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/new)** and click **"Add New Project"** → Import the same Git repository again.

2. **Configure Project Settings for Frontend**:
   - **Project Name**: `hostiq-hotel` (or any name you like)
   - **Root Directory**: Click **Edit** and select `frontend` 📁
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Add Environment Variable**:
   Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://hostiq-backend-xxx.vercel.app` *(Replace with your Step 1 backend URL)*

4. **Click "Deploy"** 🚀
   - Your frontend will build and go live at `https://hostiq-hotel-xxx.vercel.app`!

---

## 📁 Repository Structure Ready for Vercel

```
Hotel/
├── backend/
│   ├── main.py               # FastAPI application with CORS & health check
│   ├── vercel.json           # Vercel serverless Python configuration
│   ├── requirements.txt      # Python dependencies for Vercel
│   └── .env.example          # Neon DB environment variable template
│
├── frontend/
│   ├── src/services/api.js   # Dynamic API_BASE_URL (reads VITE_API_URL)
│   ├── package.json          # Vite + React build scripts
│   ├── vercel.json           # Client-side SPA routing configuration
│   └── .env.example          # Frontend VITE_API_URL template
│
├── vercel.json               # Root monorepo deployment config (optional)
└── DEPLOYMENT_GUIDE.md       # This guide
```
