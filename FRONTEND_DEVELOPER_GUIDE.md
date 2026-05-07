# RUKA SENTE Frontend Developer Guide

For frontend and mobile engineers integrating with:
- `rukasente-be` (Go / Gin)
- `rukasente-scoring` (Python / FastAPI)

## 1) What is Ruka Sente?

Ruka Sente is a mobile-money lending service built on top of the RukaPay wallet ecosystem.

`rukasente-be` is the lending control plane. It owns:
- Staff accounts, roles, and permissions (RBAC)
- Borrower profiles, subscriptions, and consents
- Loan products and loan applications
- Credit scoring orchestration
- Immutable audit trail

What it does **not** own:
- Wallet data is not stored in `rukasente-be`; it is fetched from `rdbs_core` via `RUKA_RDBS_BASE_URL`.
- Scoring math is done by the Python service (`services/scoring`), not the Go API.

Route families:
- `/api/v1/admin/*` → staff dashboard, JWT auth
- `/api/v1/internal/*` → mobile app/server-to-server, `X-Internal-API-Key`

---

## 2) Base URL and Route Structure

Base URL:

`https://<your-host>/api/v1/`

All API routes share `/api/v1` (configured in `cmd/api/main.go`).

Key route groups:
- Public:
  - `GET /`
  - `GET /health`
  - `/swagger/*any`
  - `/redoc`
- Admin auth (no JWT):
  - `POST /api/v1/admin/auth/login`
  - `POST /api/v1/admin/auth/refresh`
- Admin protected:
  - all other `/api/v1/admin/**` routes (JWT + permission checks)
- Internal:
  - `/api/v1/internal/**` (`X-Internal-API-Key`)

Versioning:
- current: `v1`
- future breaking changes should be introduced via `v2` prefix.

---

## 3) Authentication

### 3.1 Staff JWT (`/admin/*`)

Login:

`POST /api/v1/admin/auth/login`

Returns:
- `access_token`
- `refresh_token`
- `expires_in_seconds`
- `user` with `roles` and `permissions`

Use:
- `Authorization: Bearer <access_token>` on protected admin routes.

Refresh:

`POST /api/v1/admin/auth/refresh`

Important:
- refresh rotates both tokens;
- old refresh token is revoked.

Current user:

`GET /api/v1/admin/me`

Logout:

`POST /api/v1/admin/auth/logout`

Tip:
- include `refresh_token` in logout payload to revoke it immediately.

### 3.2 Internal API key (`/internal/*`)

Header:

`X-Internal-API-Key: <RUKA_INTERNAL_API_KEY>`

Behavior:
- dev: key may be empty (check skipped)
- staging/prod: key required

Browser note:
- do not call `/internal/*` from browser dashboards.

### 3.3 CORS

Configured by:
- `RUKA_ALLOWED_ORIGINS`

Allowed headers include:
- `Accept`
- `Authorization`
- `Content-Type`

---

## 4) API Response Envelope and Errors

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "borrower not found"
  }
}
```

Common `error.code` mapping:
- `validation_error` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `conflict` (409)
- `internal_error` (500)
- `bad_gateway` (502)
- `service_unavailable` (503)

Paginated list shape:

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 137,
    "page": 1,
    "page_size": 20,
    "total_pages": 7
  }
}
```

---

## 5) Core User Journeys

### 5.1 Staff dashboard auth flow
- `POST /admin/auth/login`
- store tokens + `permissions[]`
- `GET /admin/me` on app boot/session restore
- `POST /admin/auth/refresh` before access token expiry
- `POST /admin/auth/logout`

### 5.2 Borrower enrollment and consents (internal)
- `POST /internal/borrowers/enroll`
- `POST /internal/borrowers/:rukapayUserId/consents?wallet_id=...`
- `GET /internal/borrowers/:rukapayUserId/consents?wallet_id=...`

Minimum for scoring:
- linked wallet exists
- required consents accepted (`transaction_history`, `credit_check`)

### 5.3 Credit scoring
Run:
- `POST /internal/scoring/borrowers/:rukapayUserId/run?wallet_id=...`

Read:
- `GET /internal/scoring/borrowers/:rukapayUserId/latest`
- `GET /internal/scoring/borrowers/:rukapayUserId/history`

Admin scoring views:
- `/admin/scoring/results`
- `/admin/scoring/rules`
- `/admin/manual-review-cases`
- `/admin/eligibility-decisions`

### 5.4 Loan products/applications/repayments
Admin:
- manage loan products + rules
- review applications (`sent_to_review | approved | declined | disbursed`)

Internal:
- list eligible products
- submit application
- post repayment

---

## 6) Pagination and Filtering

Standard params:
- `page` (default 1)
- `page_size` (default 20)

Examples:
- `/admin/loan-products?active=true&currency=UGX&search=...`
- `/admin/loan-applications?status=pending&product_id=...&borrower_id=...`
- `/admin/audit-logs?action=...&from=<RFC3339>&to=<RFC3339>`

---

## 7) Scoring Orchestration (Conceptual)

When `/internal/scoring/.../run` is called, Go orchestration:
- validates borrower/subscription/wallet/consents
- fetches wallet transactions from `rdbs_core`
- computes aggregate features
- persists input snapshot for audit
- calls Python scoring service (`/v1/score`)
- stores score + eligibility decision
- opens manual review case when needed
- writes audit log

---

## 8) API Docs and Explorers

Go API (`rukasente-be`):
- `/swagger/index.html`
- `/swagger/doc.json`
- `/redoc`
- `/health`

Scoring service:
- `/docs`
- `/openapi.json`
- `/redoc`
- `/health`
- `POST /v1/score` (Go service calls this; frontend does not)

---

## 9) Local Run Essentials

Core settings:
- `RUKA_ENV`
- `RUKA_HOST`, `PORT`
- `RUKA_DATABASE_*`
- `RUKA_JWT_SECRET`, `RUKA_JWT_ACCESS_TTL`, `RUKA_JWT_REFRESH_TTL`
- `RUKA_INTERNAL_API_KEY`
- `RUKA_ALLOWED_ORIGINS`
- `RUKA_RDBS_BASE_URL`
- `RUKA_SCORING_SERVICE_URL`

Run:

```bash
# Go API
make run

# Scoring service
cd services/scoring && python3 main.py
```

---

## 10) Frontend Integration Checklist

- Use only `/admin/*` routes from browser dashboard
- Store and refresh JWT token pairs correctly
- Use `permissions[]` to gate UI actions before API calls
- Handle envelope format (`success/data` vs `success/error`)
- Implement global handling for `401`, `403`, and `409`
- Standardize pagination UI with `items/total/page/page_size/total_pages`

