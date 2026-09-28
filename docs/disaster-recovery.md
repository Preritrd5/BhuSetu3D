# BhuSetu 3D Disaster Recovery & Backup Strategy

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. Recovery Objectives

- **Recovery Point Objective (RPO):** $\le 24$ hours (Daily automated Supabase WAL backups + PITR on Pro tier).
- **Recovery Time Objective (RTO):** $\le 2$ hours (Database restore + container redeployment).

---

## 2. Backup Strategy (Supabase Managed PostgreSQL)

- **Database Engine**: Supabase automated snapshot backups with encrypted at-rest storage.
- **Scope of Database Backups**:
  - All cadastral parcels, buildings, floors, and vertical units.
  - Multi-epoch 4D temporal state snapshots and change events.
  - Immutable SHA-256 hash-chained audit logs.
  - Deterministic quality score snapshots and active issues.
- **Evidence Object Storage**:
  - Supabase Storage buckets configured with multi-region redundancy.
  - Raw sensor point clouds, orthophotos, and title deed documents.

---

## 3. Disaster Response Scenarios

| Failure Scenario | Immediate Action | Recovery Procedure |
|---|---|---|
| **Database Corruption / Data Loss** | Halt ingress traffic via Nginx 503 maintenance page. | Initiate Supabase point-in-time recovery (PITR) to pre-incident timestamp. Run `alembic current` to verify schema version. |
| **Backend Container Crash** | Docker daemon automatically restarts container (`restart: always`). | Inspect `/var/log/nginx/error.log` and container logs. If persistent crash, redeploy prior image tag. |
| **Gemini AI API Outage** | Application gracefully degrades: AI Investigator indicates service unavailable. | Core cadastral mapping, 3D property visualization, and statutory verification continue operating normally. |
| **Secret Compromise** | Immediately revoke compromised token/key. | Rotate database password in Supabase dashboard. Update environment variables in production and restart containers. |

---

## 4. Staging Restore Drill Checklist

1. [ ] Create temporary testing database instance.
2. [ ] Restore latest automated backup archive.
3. [ ] Verify PostGIS 3.4 extension is active and operational.
4. [ ] Run `SELECT ST_IsValid(geom_2d) FROM public.parcels LIMIT 5;`.
5. [ ] Verify audit log cryptographic hash chain continuity (`GET /api/v1/verification/audit-chain/verify`).
6. [ ] Confirm application can connect, authenticate, and render property records.
7. [ ] Destroy temporary drill instance after successful audit.
