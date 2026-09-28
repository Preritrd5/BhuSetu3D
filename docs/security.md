# BhuSetu 3D Production Security Architecture

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. Authentication & Session Security

- **Cryptographic Verification**:
  - Validates Supabase Auth JWTs directly via HMAC-SHA256 signature verification or Supabase `/auth/v1/user` gateway.
  - Expired tokens and forged signatures immediately return HTTP 401 with `WWW-Authenticate: Bearer`.
- **Role-Based Access Control (RBAC)**:
  - Strict server-side role enforcement via `require_role(...)` and `require_any_role(...)`.
  - Roles: `ADMIN`, `SURVEYOR`, `GOVERNMENT_OFFICER`, `PLANNER`, `ANALYST`, `PUBLIC_USER`.
  - A malicious user cannot elevate privileges or modify resources by manipulating client state.
- **Brute-Force & Credential Stuffing Defense**:
  - Sliding window rate limiter throttles authentication attempts to 5 requests per minute per IP.
  - Exceeded thresholds return HTTP 429 Too Many Requests with a `Retry-After` header.

---

## 2. API & Network Security

- **Content-Security-Policy (CSP)**:
  - Whitelists only approved asset domains for Cesium terrain, OpenStreetMap tiles, Google Fonts, and Supabase endpoints.
  - Restricts frame embedding with `frame-ancestors 'none'`.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff` (prevents MIME type sniffing)
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **CORS Hardening**:
  - Strictly prohibits wildcard `*` origins in production when credentials are supported.
  - Origins are read from validated environment variables.
- **Request Size Limiting**:
  - Enforces a 50 MB hard limit on API request payloads, returning HTTP 413 Payload Too Large if violated.

---

## 3. SQL Injection & Arbitrary Query Prevention

- **Parameterized SQLAlchemy / PostGIS Queries**:
  - Zero raw user string concatenation in SQL queries.
  - Bounding box parameters, distance thresholds, and coordinates are strictly parsed and validated as floats using Pydantic models.
- **AI Spatial Investigator Boundaries**:
  - Gemini outputs structured spatial intents mapped to pre-approved deterministic tools in `SpatialToolRegistry`.
  - AI is technically prohibited from executing arbitrary SQL, mutating data, changing verification statuses, or altering quality scores.

---

## 4. File Ingestion & Object Storage Security

- **MIME & Magic Byte Verification**:
  - Inspects file headers to reject disguised executables (`\x7fELF`, `MZ`, `#!`) masquerading as `.geojson` or `.png`.
- **Path Traversal Sanitization**:
  - Strips `../`, `..\\`, and null bytes from uploaded filenames and assigns UUID-prefixed internal storage keys.
- **Zip Slip & Decompression Bomb Defense**:
  - Archives are inspected before extraction to ensure no member contains directory traversal characters.
  - Extraction byte limits (max 50 MB) and member count limits (max 100 files) prevent decompression denial-of-service.
- **Short-Lived Evidence Signed URLs**:
  - Evidence files are stored in private Supabase buckets and accessed solely via time-bounded signed URLs (default 15 minutes).

---

## 5. Audit Trail & Cryptographic Chaining

- Preserves the Phase 11 SHA-256 hash-chained immutable audit log.
- Audit logs are append-only. PostgreSQL database policies prohibit `UPDATE` and `DELETE` on `public.audit_logs`.
- Every statutory review decision records reviewer ID, previous hash, canonical event hash, and timestamp.
