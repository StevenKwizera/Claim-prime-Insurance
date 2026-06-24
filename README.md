# Prime Insurance Claims Portal

**Digital claims verification & decision system** for Prime Life Insurance Rwanda.

Claimants submit claims and upload evidence. Staff verify documents, review AI-assisted risk signals, and record **approved** or **rejected** outcomes. This is a **verification platform only** — there is **no payment or payout processing**.

[![Repository](https://img.shields.io/badge/GitHub-Claim--prime--Insurance-181717?logo=github)](https://github.com/StevenKwizera/Claim-prime-Insurance)

---

## Highlights

| Area | What you get |
|------|----------------|
| **Claim intake** | Multi-step forms for Motor, Health, and Property lines |
| **Evidence** | Photos, PDFs, and videos with gallery, preview, add / replace / delete |
| **Verification** | Officer workspace — approve, reject, request info, escalate, investigate |
| **AI assistance** | Document classification, completeness checks, fraud risk scoring (rule-based) |
| **Reporting** | PDF & CSV exports — portfolio, fraud register, officer workload, regional breakdown |
| **Security** | JWT auth, role-based access, password reset, admin OTP for selected accounts |
| **i18n** | English, Kinyarwanda, and French UI labels |

---

## Roles

| Role | Main capabilities |
|------|-------------------|
| **Claimant** | Submit claims, upload evidence, track status, manage own files |
| **Agent** | Assisted intake for clients |
| **Officer** | Review queue, verification workspace, claim decisions |
| **Supervisor** | Escalations, SLA overview, team workload |
| **Fraud investigator** | High-risk and investigation claims |
| **Admin** | User management, security, system reports |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| **Backend** | Java 17+, Spring Boot 3, Spring Security, JDBC |
| **Database** | PostgreSQL |
| **Auth** | JWT, BCrypt, email OTP (Gmail SMTP) |
| **Exports** | jsPDF, CSV downloads |

**Default ports:** API `http://localhost:4000` · UI `http://localhost:5173`

---

## Project structure

```
├── frontend/          # React SPA (pages, components, hooks, services)
├── backend/           # Spring Boot API, schema, seed data
│   ├── local.env      # Your secrets (gitignored — create from .env.example)
│   └── database.json  # Seed users, claims, notifications
├── scripts/           # Evidence media fetch, DB sync helpers
├── SYSTEM_FLOW.md     # End-to-end process map
├── SYSTEM_ARCHITECTURE.md
└── REQUIREMENTS_IMPLEMENTATION.md
```

---

## Prerequisites

- **Node.js** 18+
- **Java** 17+ (22 works)
- **Maven** 3.8+
- **PostgreSQL** 14+
- **Gmail App Password** (optional but recommended for OTP & password-reset emails)

---

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/StevenKwizera/Claim-prime-Insurance.git
cd Claim-prime-Insurance
```

### 2. Create the database

```sql
CREATE DATABASE cyuzuzo_db;
```

### 3. Configure environment

```bash
cp backend/.env.example backend/local.env
```

Edit `backend/local.env`:

| Variable | Purpose |
|----------|---------|
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | PostgreSQL connection |
| `MAIL_USERNAME` | Gmail address used for SMTP login |
| `MAIL_PASSWORD` | [Gmail App Password](https://myaccount.google.com/apppasswords) (16 chars, no spaces) |
| `MAIL_FROM` | Display name + **same Gmail** as `MAIL_USERNAME` |
| `EXPOSE_OTP_IN_RESPONSE` | `true` in dev — shows OTP on screen if email fails |

> **Never commit `backend/local.env`.** It is listed in `.gitignore`.

### 4. Install dependencies

```bash
npm install
```

### 5. Run the application

**Terminal 1 — API**

```bash
npm run backend
```

Wait for: `Started CyuzuzoBackendApplication` and `Loaded … variable(s) from … local.env`

**Terminal 2 — UI**

```bash
npm run dev
```

Open **http://localhost:5173**

### 6. Verify backend health

```bash
curl http://localhost:4000/health
```

Expected: `{"status":"ok","database":"cyuzuzo_db"}`

### 7. Test email (optional)

```bash
curl -X POST http://localhost:4000/api/auth/mail/test \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"your@gmail.com\"}"
```

---

## Demo accounts

Seeded on first backend start. **Default password for all demo users: `password`**

| Email | Role |
|-------|------|
| `claimant@prime.rw` | Claimant |
| `agent@prime.rw` | Agent |
| `officer@prime.rw` | Claims Officer |
| `supervisor@prime.rw` | Supervisor |
| `fraud@prime.rw` | Fraud Investigator |
| `admin@prime.rw` | Admin (password only) |
| `cyuzuzophoebe@gmail.com` | Admin (password + email OTP) |
| `kwizerasteven2000@gmail.com` | Admin (password + email OTP) |

**Admin OTP:** Selected admin accounts require a 6-digit code after password. If SMTP is not configured, the code appears on the login screen when `EXPOSE_OTP_IN_RESPONSE=true`.

---

## NPM scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (`:5173`) |
| `npm run backend` | Start Spring Boot (`:4000`) with `local.env` |
| `npm run build` | Production frontend build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run evidence:fetch` | Download thematic evidence placeholder images |
| `npm run db:sync-seed` | Sync seed claims helper script |

---

## Claim workflow (summary)

1. **Login** → role-based dashboard  
2. **Submit claim** → type, narrative, evidence upload  
3. **AI intake** → document checklist, risk score, routing to officer  
4. **Verification** → officer reviews evidence and decides  
5. **Tracking** → claimant sees timeline and status  
6. **Reports** → supervisors/admins export PDF/CSV registers  

See [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) for the full route and API mapping.

---

## AI & fraud scoring (important)

The “AI” layer in this project is **rule-based simulation** for academic demonstration:

- Document types are inferred from **file names and keywords**, not real OCR/ML models  
- Confidence and fraud scores use **fixed heuristics**, not trained models  
- The help chatbot uses **keyword FAQ matching**, not an LLM  

Suitable for coursework and portfolio demos. For production, integrate real OCR, model serving, and audit pipelines.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend exits on startup (`amount` null) | Pull latest `main`; restart backend after seed fix |
| `MAIL_PASSWORD is empty` in logs | Run `npm run backend` (loads `local.env`) or restart after editing `local.env` |
| Gmail authentication failed | Regenerate App Password; set `MAIL_FROM` to the **same** address as `MAIL_USERNAME` |
| Forgot-password email not received | Check spam; use the **6-digit code** shown on screen in dev mode |
| Port 4000 already in use | Stop the old Java process, then restart backend |
| Frontend cannot reach API | Ensure backend is on `:4000`; dev proxy is configured in `frontend/vite.config.ts` |

---

## Documentation

- [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) — End-to-end user journeys  
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — Components, schema, security  
- [SYSTEM_MODULES.md](./SYSTEM_MODULES.md) — Module breakdown  
- [REQUIREMENTS_IMPLEMENTATION.md](./REQUIREMENTS_IMPLEMENTATION.md) — Requirements traceability  
- [REGISTRATION_USER_MANAGEMENT.md](./REGISTRATION_USER_MANAGEMENT.md) — Users & admin flows  
- [CASE_STUDY_E2E_FLOW.md](./CASE_STUDY_E2E_FLOW.md) — Case study walkthrough  

---

## Security notes (development)

- Change default JWT secret and database passwords before any public deployment  
- Keep `backend/local.env` out of version control  
- Rotate Gmail App Passwords if they are ever exposed  
- Review claim access rules before production (name-based access in demo mode)  

---

## Author

**Steven Kwizera**  
GitHub: [@StevenKwizera](https://github.com/StevenKwizera)

Academic / portfolio project — Prime Life Insurance Rwanda claims verification system.

---

## License

This project is provided for educational and portfolio purposes. Contact the author for other use.
