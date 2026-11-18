# WorkTrack — Employee Management & Task Performance Platform

WorkTrack is a production-ready, full-stack enterprise SaaS application built on a modular monolithic **MERN** architecture. It delivers three distinct, role-based workspaces for **Employees**, **Managers**, and **Administrators**, combining task lifecycle management, versioned deliverables & approvals, attendance tracking, leave management, daily work reports, transparent multi-factor performance analytics, notifications, and audit activity logs.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Radix UI / shadcn-style primitives, React Router v7, TanStack Query, Axios, React Hook Form, Zod, Recharts, Lucide React, Sonner |
| **Backend** | Node.js, Express.js, Mongoose, MongoDB Atlas, JWT (`HttpOnly` cookies), bcryptjs, Zod, Multer, Cloudinary (with local dev fallback), Helmet, Express Rate Limit |
| **Testing** | Vitest, Supertest, `mongodb-memory-server`, React Testing Library |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## Project Structure

```text
worktrack-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # env, db, cloudinary
│   │   ├── middleware/      # auth, rbac, validate, upload, rateLimit, error
│   │   ├── modules/         # auth, users, employees, departments, tasks, attendance,
│   │   │                    # leave, daily-reports, feedback, performance, reports,
│   │   │                    # notifications, activity-logs, dashboard, settings
│   │   ├── seed/            # idempotent demo dataset seeder
│   │   ├── utils/           # apiResponse, AppError, pagination, scope, mailer, storage
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/               # API, workflow & RBAC security integration tests
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # ui primitives, common (DataTable, MetricStrip, States), modals/drawers
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useDebounce
│   │   ├── layouts/         # AuthLayout, PortalShell, EmployeeLayout, ManagerLayout, AdminLayout
│   │   ├── pages/           # auth/, employee/, manager/, admin/, shared/
│   │   ├── routes/          # AppRoutes, ProtectedRoute
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── services/        # Axios client & per-module API clients
│   │   └── utils/           # formatters, statusMaps, CSV export
│   ├── vercel.json
│   └── .env.example
├── DESIGN_SYSTEM.md
├── API_DOCS.md
└── render.yaml
```

---

## Local Development Setup

### Prerequisites
- Node.js `>= 20`
- npm `>= 10`
- A MongoDB Atlas connection string (or use `USE_IN_MEMORY_DB=true` for instant zero-config local evaluation)

### 1. Install Dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
- **Option A (MongoDB Atlas)**: Set `MONGODB_URI` to your Atlas URI and `USE_IN_MEMORY_DB=false`, then seed demo data:
  ```bash
  npm run seed
  ```
- **Option B (Instant Local Dev without Atlas)**: Leave `MONGODB_URI=` blank and set `USE_IN_MEMORY_DB=true`. The backend automatically starts an in-memory MongoDB instance and seeds demo accounts on boot.

### 3. Run Backend & Frontend
Open two terminals:
```bash
# Terminal 1 — Express API on http://localhost:5000
npm run dev:backend

# Terminal 2 — Vite React App on http://localhost:5173
npm run dev:frontend
```

### Demo Accounts (Seeded)
All demo accounts use password **`WorkTrack@123`**:

| Role | Email | Portal |
| :--- | :--- | :--- |
| **Administrator** | `admin@worktrack.io` | `/admin/dashboard` |
| **Manager (Engineering)** | `manager@worktrack.io` | `/manager/dashboard` |
| **Employee (Engineering)** | `employee@worktrack.io` | `/employee/dashboard` |
| **Manager (Design)** | `claire.bennett@worktrack.io` | `/manager/dashboard` |
| **Employee (Design)** | `marcus.chen@worktrack.io` | `/employee/dashboard` |

---

## Running Tests & Production Build

```bash
# Run all backend + frontend automated tests
npm test

# Run backend API & RBAC security suite only
npm run test:backend

# Run frontend component & guard tests only
npm run test:frontend

# Production frontend bundle
npm run build
```

---

## Production Deployment

### Backend (Render)
1. Push the repository to GitHub.
2. Create a new Web Service on Render (or import `render.yaml` as a Blueprint) targeting `backend/`.
3. Set environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your MongoDB Atlas URI>`
   - `JWT_SECRET=<strong 64-char random secret>`
   - `FRONTEND_URL=https://<your-vercel-app>.vercel.app`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
4. Run `npm run bootstrap:prod` once via Render Shell (with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` set) to initialize default settings, role permissions, and your first real Administrator account with zero demo data.

### Frontend (Vercel)
1. Import the repository in Vercel and set **Root Directory** to `frontend`.
2. Set `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`.
3. `frontend/vercel.json` is pre-configured with SPA rewrites so direct navigation to `/employee/*`, `/manager/*`, and `/admin/*` resolves cleanly.

---

## Additional Documentation
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Visual tokens, typography scale, component specifications, UX states, and portal architecture.
- [API_DOCS.md](./API_DOCS.md) — Complete `/api/v1` REST API contract and RBAC rules.
