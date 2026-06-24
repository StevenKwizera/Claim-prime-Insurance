# Case study: Jean’s car accident claim (end-to-end)

**System type:** Digital Claims Verification & Decision — **no payment processing.**

## Demo accounts for this walkthrough

| Step | Role | Login |
|------|------|--------|
| 1–3, 8, 10 | Claimant (Jean) | `jean@prime.rw` / `password` (or `claimant@prime.rw`) |
| 7–9 | Officer | `officer@prime.rw` / `password` |
| 5 (optional) | Investigator | `fraud@prime.rw` / `password` |
| 11–12 | Admin | `admin@prime.rw` / `password` |

---

## Flow map

| Step | Case study | In the app |
|------|------------|----------|
| 1 | Login → claimant dashboard | `/login` → `/dashboard` — **Submit New Claim**, **Track Status**, **My Claims** |
| 2 | Submit car accident claim | `/claims/new` — 3 steps; draft ID on save draft |
| 3 | Upload photos, police PDF, estimate | Step 3 evidence (names with `police`, `estimate`, `photo` trigger AI labels) |
| 4 | AI document analysis | Auto on submit — timeline + **Needs Officer Review** on claim detail |
| 5 | AI fraud detection | Risk score **55/100** (medium) when estimate is flagged |
| 6 | Routed to officer · Under Review | Status **Under Review**; notification *“being reviewed by an officer”* |
| 7 | Officer reviews evidence & AI | `/verification` or `/claims/{id}` — **officer@prime.rw** |
| 8 | Request garage details | **Request info** → notification *“Additional information required”* |
| 9 | Jean uploads quotation | `/evidence/upload` — attach file with `garage` or `quotation` in name |
| 10 | Officer approves | **Approve** → status **Approved**; *“no payment processed”* message |
| 11 | Analytics | `/analytics` (supervisor/admin) |
| 12 | Audit | `/reports/audit-trail` (admin) |

---

## Suggested Jean demo (5 minutes)

1. Sign in as **jean@prime.rw** → **Submit New Claim** → Auto → fill incident → upload `police-report.pdf`, `repair-estimate.pdf`, `damage-photo.jpg` → Submit.  
2. Open **Notifications** — see review message. **Track** claim — status **Under Review**.  
3. Sign out → **officer@prime.rw** → open claim from verification queue → review AI panel (risk 55, flagged estimate).  
4. **Request info** → sign in as Jean → upload `garage-quotation.pdf` on evidence page.  
5. Officer → **Approve** → Jean sees **Approved** and approval notification.

---

## Summary diagram

```
Login → Submit Claim → Upload Evidence → AI Document Check → AI Fraud Score
  → Under Review → Officer Review → [Request Info] → Final Decision → Approved
  → Analytics & Audit (no payment)
```
