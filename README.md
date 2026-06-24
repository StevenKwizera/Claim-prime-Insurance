# Prime Insurance Claims Portal

Digital claims verification system for Prime Life Insurance Rwanda — submit claims, upload evidence, officer review, AI-assisted document checks, and reporting. **Verification only; no payment processing.**

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind (`frontend/`)
- **Backend:** Spring Boot, PostgreSQL (`backend/`)
- **Ports:** API `4000`, UI `5173`

## Quick start

### Prerequisites

- Node.js 18+
- Java 17+
- PostgreSQL
- Maven

### Database

Create database `cyuzuzo_db` (or set `PGDATABASE` in `backend/local.env`).

### Configuration

Copy `backend/.env.example` to `backend/local.env` and set PostgreSQL + Gmail App Password for OTP / password reset emails.

**Do not commit `backend/local.env`** — it is gitignored.

### Run

```bash
npm install
npm run backend   # Spring Boot on :4000
npm run dev       # Vite on :5173
```

## Docs

- [SYSTEM_FLOW.md](./SYSTEM_FLOW.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [REQUIREMENTS_IMPLEMENTATION.md](./REQUIREMENTS_IMPLEMENTATION.md)

## License

Academic / portfolio project — Steven Kwizera.
