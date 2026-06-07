# AI-Powered HRMS

> A full-stack Human Resource Management System built with React 19, Express.js, PostgreSQL, and Groq Llama 3.3 70B — designed for 5,000+ employees.

![Dashboard](hrms/screenshots/dashboard_fixed2.png)

---

## Features

**12 HR Modules:**

| Module | Highlights |
|--------|-----------|
| Dashboard | Role-scoped KPI widgets, charts, AI attrition risk overview |
| Employees | Full lifecycle management, soft delete, RBAC data stripping |
| Org Chart | Visual reporting hierarchy from self-referential DB model |
| Attendance | Clock-in/out, monthly calendar view, auto hours calculation |
| Leave | Apply → Approve workflow, atomic balance tracking, 5 leave types |
| Payroll | Auto calculations (Basic/HRA/PF/TDS), batch generation, PDF export |
| Performance | 5-dimension scoring, AI narrative generation, PIP flagging |
| Recruitment | Job postings, candidate pipeline, AI resume screening |
| Helpdesk | Ticketing system with AI-suggested replies, SLA priorities |
| Onboarding | Auto-seeded task checklists per new hire, progress tracking |
| Notifications | Dynamic generation from live data — no stale notification table |
| Audit Log | Immutable INSERT-only trail for every sensitive action |

---

## Screenshots

<table>
  <tr>
    <td><img src="hrms/screenshots/login.png" alt="Login"/><p align="center">Login</p></td>
    <td><img src="hrms/screenshots/employees.png" alt="Employees"/><p align="center">Employees</p></td>
    <td><img src="hrms/screenshots/employee_profile.png" alt="Profile"/><p align="center">Employee Profile</p></td>
  </tr>
  <tr>
    <td><img src="hrms/screenshots/attendance.png" alt="Attendance"/><p align="center">Attendance</p></td>
    <td><img src="hrms/screenshots/leave.png" alt="Leave"/><p align="center">Leave Management</p></td>
    <td><img src="hrms/screenshots/payroll.png" alt="Payroll"/><p align="center">Payroll</p></td>
  </tr>
  <tr>
    <td><img src="hrms/screenshots/performance.png" alt="Performance"/><p align="center">Performance Reviews</p></td>
    <td><img src="hrms/screenshots/recruitment.png" alt="Recruitment"/><p align="center">Recruitment + AI Screening</p></td>
    <td><img src="hrms/screenshots/helpdesk.png" alt="Helpdesk"/><p align="center">Helpdesk</p></td>
  </tr>
  <tr>
    <td><img src="hrms/screenshots/org_chart.png" alt="Org Chart"/><p align="center">Org Chart</p></td>
    <td><img src="hrms/screenshots/onboarding.png" alt="Onboarding"/><p align="center">Onboarding</p></td>
    <td><img src="hrms/screenshots/audit.png" alt="Audit"/><p align="center">Audit Log</p></td>
  </tr>
</table>

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- TanStack React Query — server state & caching
- Zustand — auth, theme, UI state
- Tailwind CSS + Radix UI (headless, accessible)
- Recharts — dashboard charts
- jsPDF — client-side payslip PDF export

**Backend**
- Node.js + Express.js + TypeScript
- Drizzle ORM — type-safe, schema-first
- PostgreSQL 16 — ACID transactions, composite unique constraints
- Zod — runtime validation on every endpoint
- JWT (HS256) in httpOnly cookies + Bearer fallback
- bcryptjs — password hashing

**AI**
- Groq API — Llama 3.3 70B at ~500 tokens/sec
- Features: resume screening, attrition risk, performance review generation, helpdesk reply suggestions, conversational navigation

---

## Project Structure

```
/
├── hrms/               # React frontend (Vite)
│   ├── src/
│   │   ├── features/   # 12 domain modules (co-located pages/components/hooks)
│   │   ├── components/ # Shared UI (Radix primitives, charts, layout)
│   │   ├── store/      # Zustand stores (auth, theme, ui)
│   │   ├── data/api/   # API layer functions (one file per domain)
│   │   └── lib/        # apiClient, pdf, csv, format utilities
│   └── ...
└── hrms-backend/       # Express backend
    ├── src/
    │   ├── routes/     # 14 route files (one per domain)
    │   ├── services/   # Business logic
    │   ├── middleware/ # auth, role guard, zod validation
    │   ├── db/
    │   │   ├── schema/ # Drizzle table definitions (15 tables)
    │   │   └── migrations/
    │   └── ai/         # Groq client + AI service implementations
    └── tests/          # Jest integration tests + Vitest unit tests
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Groq API key — [get one free at console.groq.com](https://console.groq.com)

---

### 1. Backend Setup

```bash
cd hrms-backend
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrms_dev
JWT_SECRET=your-256-bit-secret
GROQ_API_KEY=gsk_...
CORS_ORIGINS=http://localhost:5173
PORT=4000
NODE_ENV=development
```

Run migrations and seed 5,000 employees:

```bash
npm run db:migrate
npm run db:seed
```

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:4000`

---

### 2. Frontend Setup

```bash
cd hrms
npm install
```

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Demo Login

The app has a one-click demo login — no sign-up needed:

| Role | Access Level |
|------|-------------|
| **HR Admin** | Full system access — all employees, payroll, audit log |
| **Manager** | Team-scoped — approve leaves, write reviews for direct reports |
| **Employee** | Self-service — own attendance, leave, payslips, helpdesk |

Click **Demo Login** on the login page and select a role.

---

## Role-Based Access Control

- **4 roles:** admin, hr, manager, employee
- **Endpoint-level guards** via `requireRole()` middleware
- **Data-level stripping** — salary and phone invisible to other employees even if endpoint is accessible
- **Demo login disabled in production**

---

## Key Technical Decisions

- **Atomic leave balance** — `SET used = used + $days` inside `db.transaction()` prevents race conditions
- **Idempotent payroll batch** — unique `(employeeId, month)` constraint + `onConflictDoNothing()` makes re-runs safe
- **No notifications table** — notifications generated on-the-fly from `leave_requests` and `payroll`; only read state persisted
- **Soft deletes** — `isDeleted = true` preserves payroll/leave history for compliance
- **N+1 eliminated** — dashboard attrition query uses single `COUNT(DISTINCT CASE WHEN ...)` aggregation

---

## Running Tests

**Backend integration tests (real PostgreSQL):**

```bash
cd hrms-backend
npm test
```

**Frontend unit tests:**

```bash
cd hrms
npm test
```

---

## License

MIT
