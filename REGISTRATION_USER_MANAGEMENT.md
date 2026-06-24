# Registration and User Management Module

## Scope

The module separates public claimant registration from controlled internal staff provisioning.

- Claimants self-register through `/register`, verify OTP, then login with email and password.
- Staff users do not self-register. Admin creates staff accounts through `/admin/users`.
- Login uses email and password only. The authenticated user's role determines dashboard access.

## Roles

- Claimant
- Agent
- Claims Officer
- Supervisor
- Investigator
- Compliance Officer
- Admin
- Admin

## Authentication Flow

Claimant:

```text
Register -> Validate Form -> Send Email/SMS OTP -> Verify OTP -> Activate Account -> Login -> Claimant Dashboard
```

Staff:

```text
Admin Creates Account -> Activation Email -> Password Setup -> MFA Setup -> Dashboard Access
```

Login:

```text
Email + Password -> bcrypt/Argon2 Password Check -> JWT Issued -> RBAC Route Guard -> Role Dashboard
```

## API Endpoints

Recommended production endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register/claimant`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{id}`
- `PATCH /api/users/{id}/activate`
- `PATCH /api/users/{id}/deactivate`
- `POST /api/users/{id}/reset-password`
- `PATCH /api/users/{id}/mfa`
- `GET /api/users/{id}/login-audit`

## Database Tables

Implemented in `backend/src/main/resources/schema.sql`:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `login_audit_logs`
- `password_resets`
- `otp_verifications`

## Security Practices

- JWT access tokens with server-side signature validation.
- Password hashing with bcrypt now, Argon2 recommended for production.
- MFA/2FA required for staff roles.
- OTP verification before claimant activation.
- Account lockout after repeated failures.
- CAPTCHA after repeated failed login attempts.
- Audit logs for login, password reset, role changes, and activation changes.
- RBAC enforced on frontend routes and backend endpoints.
- Admin-only staff provisioning.
- Store password reset and OTP values as hashes, never plaintext.

## Recommended Technologies

Frontend:

- React, TypeScript, React Router, TanStack Query, Tailwind CSS.

Backend:

- Spring Boot, Spring Security, JWT, Bean Validation, JDBC/JPA.

Database:

- PostgreSQL for production, MySQL compatible with minor SQL syntax changes.

Notifications:

- Email provider for activation/password reset.
- SMS provider for OTP delivery.
