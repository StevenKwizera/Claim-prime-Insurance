# Digital Claims Verification & Decision System (#25498)

**Prime Insurance LTD** — verification and decision workflow only. **No payment, billing, or payout modules.**

**Stack:** React/Vite frontend · Spring Boot + PostgreSQL backend · JWT auth · role-based routes

**Primary roles:** Claimant · Officer · Investigator · Admin (plus Agent/Supervisor for intake and oversight in demo data)

**Flow:** Submit claim → AI checks documents & risk → **officer decides** → approved/rejected recorded.

See `SYSTEM_MODULES.md` for the canonical module and activity list.

---

## Module status summary

| # | Module | UI routes | Backend / data | Status |
|---|--------|-----------|----------------|--------|
| 1 | Digital Claim Submission | `/claims/new`, `/claims/drafts`, `/claims/confirmation`, `/claims/policy-lookup` | `POST /api/claims`, drafts, attachments | **Core done** — step form, types, upload, policy lookup UI |
| 2 | Automated Document Verification | `/verification`, `/verification/pending`, `/verification/ai-results`, `/verification/manual-approval` | Document AI labels, officer queue | **Partial** — UI + mock/heuristic AI; full OCR/rule engine TBD |
| 3 | Evidence Digitization & Storage | `/evidence/upload`, `/evidence/gallery`, `/evidence/witness-statements`, `/evidence/secure-preview` | File storage on disk, `POST .../attachments` | **Partial** — upload/gallery; watermark/chain-of-custody UI placeholders |
| 4 | Real-Time Claim Tracking | `/tracking`, `/tracking/timeline`, `/tracking/client-portal` | Timeline on claims, notifications | **Partial** — timeline + status; WebSocket/SMS not wired |
| 5 | Claim Evaluation & Decision | `/evaluation/decision`, `/evaluation/escalations`, `/evaluation/internal-notes` | Approve/reject/escalate actions | **Core done** — actions + detail page; digital signature UI light |
| 6 | Data Analytics & Insights | `/analytics`, `/analytics/executive`, `/analytics/trends`, `/analytics/performance` | `GET /api/analytics` | **Partial** — dashboards + charts; ML anomaly detection not production |
| 7 | Reporting & Compliance | `/reports`, `/reports/compliance`, `/reports/builder`, `/reports/regulatory-templates`, `/reports/audit-trail` | CSV export helpers | **Partial** — report pages + exports; scheduled/regulatory submit TBD |
| 8 | User & Access Control | `/admin/users`, `/admin/roles`, `/admin/permissions`, `/admin/login-activity`, `/admin/security` | Users API, JWT roles, `RoleRouteGuard` | **Core done** — 6 roles, route guards; SAML/SSO/2FA schema only |
| 9 | Fraud Detection & Risk Scoring | `/fraud`, `/fraud/risk-scoring`, `/fraud/flagged-claims`, `/fraud/pattern-visualization`, `/fraud/investigator-workspace` | Risk score on claims | **Partial** — scores + investigator UI; advanced graph/rules TBD |
| 10 | Communication & Notification Center | `/notifications`, `/communication`, `/notifications/templates`, `/notifications/scheduler`, `/notifications/delivery` | Notifications table, email (SMTP) | **Partial** — in-app notifications; email OTP/reset blocked until Gmail App Password valid |

---

## 1. Digital Claim Submission Module

| Feature (spec) | Status |
|----------------|--------|
| Step-by-step form + progress | Done (`SubmissionPage`) |
| Dynamic fields by claim type (auto/health/property) | Done |
| Drag-and-drop document upload | Done |
| Real-time validation | Done (frontend) |
| Save-as-draft / resume | Done (`/claims/drafts`) |
| Policy lookup / auto-fill | UI done (`/claims/policy-lookup`) |
| Submission confirmation + reference | Done (`/claims/confirmation`) |
| Mobile-responsive | Done (Tailwind) |

---

## 2. Automated Document Verification Module

| Feature (spec) | Status |
|----------------|--------|
| Pending documents queue | Done (`VerificationPage`, `/verification/pending`) |
| AI valid/invalid/flagged | Partial (client-side classification + mock) |
| Missing document requests | UI (`/verification/missing-request`) |
| Side-by-side comparison | UI placeholder (`/verification/ai-results`) |
| Manual override / approval | Done (`/verification/manual-approval`) |
| Verification history per claim | Partial (timeline on claim detail) |
| Admin rule engine panel | UI placeholder (admin settings) |

---

## 3. Evidence Digitization & Storage Module

| Feature (spec) | Status |
|----------------|--------|
| Evidence gallery + metadata | Done (`/evidence/gallery`) |
| Bulk upload / tagging | Done (`/evidence/upload`) |
| Witness statements | UI (`/evidence/witness-statements`) |
| Photo annotation | Not implemented |
| Secure preview / watermark | UI (`/evidence/secure-preview`) |
| Chain-of-custody audit | Schema/UI placeholder |

---

## 4. Real-Time Claim Tracking Module

| Feature (spec) | Status |
|----------------|--------|
| Status timeline + progress | Done (`ClaimDetailPage`, `/tracking/timeline`) |
| Staff + client dashboards | Done (role dashboards + tracking) |
| Notification center | Done (`/notifications`) |
| Estimated completion | On claim model |
| Delay / bottleneck indicators | Partial (SLA panel on home) |
| Client self-service portal | UI (`/tracking/client-portal`) |
| Exportable history | Partial (reports CSV) |
| WebSocket live updates | Not implemented |
| SMS/email on status change | Email depends on SMTP; SMS not implemented |

---

## 5. Claim Evaluation & Decision Module

| Feature (spec) | Status |
|----------------|--------|
| Evaluation workspace | Done (`/evaluation/decision`, claim detail) |
| Approve / reject / request info | Done (API actions) |
| Digital signature | UI light |
| Internal comments | UI (`/evaluation/internal-notes`) |
| Escalation path | Done (`/evaluation/escalations`) |
| Decision history + officer | Done (timeline) |
| Bulk decisions | Not implemented |

---

## 6. Data Analytics & Insights Module

| Feature (spec) | Status |
|----------------|--------|
| KPI dashboard | Done (`/analytics`, executive view) |
| Fraud alerts panel | Done (`/fraud`) |
| Trend charts by region/type | Done (`/analytics/trends`) |
| Bottleneck heatmap | UI placeholder |
| Predictive outcomes | Not implemented (ML) |
| Custom report builder | UI (`/reports/builder`) |
| Live refresh toggle | Partial |

---

## 7. Reporting & Compliance Module

| Feature (spec) | Status |
|----------------|--------|
| Regulatory templates | UI (`/reports/regulatory-templates`) |
| Custom report wizard | UI (`/reports/builder`) |
| Compliance checklist | UI (`/reports/compliance`) |
| Audit trail explorer | UI (`/reports/audit-trail`) |
| Scheduled reports | UI (`/notifications/scheduler`) |
| PDF / Excel / CSV export | CSV done; PDF/Excel partial |
| Retention policy enforcement | Not implemented |

---

## 8. User & Access Control Module

| Feature (spec) | Status |
|----------------|--------|
| Role-based dashboards | Done (6 roles) |
| User management | Done (`/admin/users`) |
| Permission matrix | UI (`/admin/permissions`) |
| Login activity logs | UI (`/admin/login-activity`) |
| Password policy / session | UI (`/admin/security`) |
| Staff login OTP | Done (email + on-screen fallback if SMTP fails) |
| Claimant registration OTP | Done |
| SAML/SSO | Not implemented |

---

## 9. Fraud Detection & Risk Scoring Module

| Feature (spec) | Status |
|----------------|--------|
| Risk scorecard per claim | Done (claim `riskScore`) |
| Pattern visualization | UI (`/fraud/pattern-visualization`) |
| Flagged claims queue | Done (`/fraud/flagged-claims`) |
| Investigator workspace | Done (`/fraud/investigator-workspace`) |
| Rules engine / thresholds | UI placeholder |
| Cross-claim pattern AI | Not implemented |

---

## 10. Communication & Notification Center

| Feature (spec) | Status |
|----------------|--------|
| Unified inbox | Done (`/notifications`, `/communication`) |
| Message templates | UI (`/notifications/templates`) |
| Notification scheduler | UI (`/notifications/scheduler`) |
| Delivery tracking | UI (`/notifications/delivery`) |
| Multi-channel (email/SMS/in-app) | In-app + email (SMTP); SMS not implemented |
| Communication audit | Partial (notifications + timeline) |

---

## Authentication & email (operational)

| Item | Status |
|------|--------|
| Login / register / forgot password | Done |
| PostgreSQL users (6 demo roles + `cyuzuzophoebe@gmail.com` admin) | Done |
| OTP API (`/api/auth/otp/send`, `verify`, staff login OTP) | Done |
| Gmail SMTP (`backend/local.env`) | **Must use valid App Password** — test: `POST /api/auth/mail/test` |
| On-screen OTP when email fails | Done (`devCode` on login/register) |

---

## Recommended next build priorities

1. Fix Gmail App Password and verify `POST /api/auth/mail/test` returns `"sent": true`
2. Claim-scoped API authorization (officers only see assigned claims)
3. Persist verification rules + OCR integration for module 2
4. WebSocket or polling for module 4 live tracking
5. Production secrets only via environment variables (no passwords in `application.properties`)

---

## How to run

```bash
npm run backend   # port 4000
npm run dev       # port 5173
```

Demo password for seed users: `password`
