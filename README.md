# Multi-Tenant School Management System

> Fast, lightweight, mobile-responsive full-stack platform engineered to eliminate administrative bottlenecks across multiple schools with strict tenant isolation, SendGrid transactional alerts, and role-based access control.

---

## 📁 Project Directory Structure

```text
school-management-system/
├── frontend/               # 🌟 DHAMAAN FRONTEND-KA (React SPA)
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── components/     # Navbar, ProtectedRoute
│   │   ├── context/        # AuthContext (JWT & login state)
│   │   ├── pages/          # Login, SuperAdmin, Teacher, Student
│   │   ├── services/       # Centralized API fetch wrapper
│   │   ├── App.jsx         # App router
│   │   ├── index.css       # Mobile-first responsive styling
│   │   └── main.jsx        # React root entry point
│   ├── index.html
│   ├── package.json
│   ├── vercel.json         # Vercel deployment config
│   └── vite.config.js      # Vite dev server & proxy settings
│
├── backend/                # 🚀 DHAMAAN BACKEND-KA (Node.js & Express API)
│   ├── database/
│   │   └── schema.sql      # MySQL Relational Schema & Demo Seeds
│   ├── src/
│   │   ├── config/         # MySQL2 promise pool connection
│   │   ├── controllers/    # Business logic (Auth, Class, User, Exam, Attendance, Fee, Report)
│   │   ├── middleware/     # JWT Auth, Role RBAC, Rate Limiting, Centralized Error Handler
│   │   ├── routes/         # Express REST API endpoints
│   │   ├── utils/          # SendGrid Email Service & audit logger
│   │   └── app.js          # Express app configuration & middleware
│   ├── .env                # Local environment settings (XAMPP MySQL)
│   ├── .env.example        # Production template (Railway)
│   ├── package.json
│   ├── server.js           # Server entry point (Port 5000)
│   └── test_api.js         # Automated End-to-End System Tests
│
├── database/               # Relational Schema backup
│   └── schema.sql
├── start-all.bat           # 1-Click launcher for both Backend & Frontend
├── start-backend.bat       # Backend standalone launcher
└── start-frontend.bat      # Frontend standalone launcher
```

---

## 🚀 Sida loo Daaro (Quick Start)

### 1. Daarka Hal-Mar Ah (One-Click)
Guji ama laba jeer ku dhufo file-ka:
* **`start-all.bat`**

### 2. Ama CMD ku Daar (Manual Start)

#### Backend:
```cmd
cd backend
npm run dev
# URL: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

#### Frontend:
```cmd
cd frontend
npm run dev
# URL: http://localhost:3000
```

---

## 🔑 Demo Login Accounts (Password: `Password123!`)

| Tenant / Dugsiga | Doorka (Role) | Email |
| :--- | :--- | :--- |
| **Greenwood International** (Tenant 1) | Super Admin (Principal) | `admin@greenwood.edu` |
| **Greenwood International** (Tenant 1) | Teacher (Mathematics) | `sarah.jenkins@greenwood.edu` |
| **Greenwood International** (Tenant 1) | Teacher (Science) | `david.miller@greenwood.edu` |
| **Greenwood International** (Tenant 1) | Student | `john.doe@student.greenwood.edu` |
| **Greenwood International** (Tenant 1) | Student | `jane.smith@student.greenwood.edu` |
| **St. Patrick High School** (Tenant 2) | Super Admin (Principal) | `admin@stpatricks.edu` |
| **St. Patrick High School** (Tenant 2) | Teacher | `emily.watson@stpatricks.edu` |
| **St. Patrick High School** (Tenant 2) | Student | `michael.b@student.stpatricks.edu` |
