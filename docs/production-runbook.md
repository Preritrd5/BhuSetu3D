# BhuSetu 3D Production Runbook

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. Routine Operational Commands

### 1.1 Health Inspection
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check API Liveness
curl -i http://localhost/api/v1/health/live

# Check API Readiness (PostgreSQL + PostGIS probe)
curl -i http://localhost/api/v1/health/ready

# Check Runtime Performance Metrics
curl -s http://localhost/api/v1/health/metrics | jq .
```

### 1.2 Log Inspection
```bash
# Stream production API logs
docker compose -f docker-compose.prod.yml logs -f api

# Stream Nginx access/error logs
docker compose -f docker-compose.prod.yml logs -f reverse-proxy
```

---

## 2. Emergency Incident Procedures

### 2.1 Restarting Stalled Services
```bash
docker compose -f docker-compose.prod.yml restart api
```

### 2.2 Rotating Secrets
1. Generate new database password or API keys in Supabase/Gemini console.
2. Update `.env.production`.
3. Re-run config validation:
   ```bash
   python -m app.core.config_validator
   ```
4. Restart application containers with zero downtime:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps api
   ```

### 2.3 Investigating Rate Limit Alerts
If legitimate surveyors report HTTP 429 errors:
1. Inspect client IP in Nginx access log with `grep "429" /var/log/nginx/access.log`.
2. If traffic is verified as bulk authoritative cadastral ingestion, increase `RATE_LIMIT_ENABLED` threshold or whitelist the IP range in `nginx.conf`.
