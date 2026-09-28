# ASTATINE: Authentication & Authorization Specification
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Governance Access Philosophy

Land title records and 3D spatial properties represent sovereign legal rights. Unauthorized alteration of parcel boundaries or floor registrations constitutes a severe threat to public trust and municipal governance. Therefore, ASTATINE enforces a strict **Role-Based Access Control (RBAC)** architecture paired with the **Principle of Least Privilege (PoLP)** and **Maker-Checker verification workflows**.

*Note: In adherence to Phase 0 execution rules, authentication is defined architecturally; no user login or active token verification code is implemented in Phase 0.*

---

## 2. User Roles & Operational Mandates

```
                           SYSTEM ROLES HIERARCHY
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
      [ADMINISTRATOR]         [GOVERNMENT OFFICER]          [SURVEYOR]
      - System Config         - Verification Sign-off       - Field Ingestion
      - User Provisioning     - Conflict Adjudication       - Geometry Editing
      - Tenant Management     - Legal Title Sync            - ETS Ground Ties
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
     [TOWN PLANNER / ANALYST]                             [PUBLIC CITIZEN]
     - Spatial & Infrastructure Queries                  - 3D ULPIN Lookup
     - Density & FAR Compliance Modeling                 - Certified Title Search
     - Public Utility Impact Reports                     - Restricted Read-Only
```

### 2.1 Role Definitions
1. **`ADMIN` (System Administrator):**
   - Manages tenant cities, coordinate reference systems (CRS), municipal boundaries, and data retention policies.
   - Provisions administrative users and assigns role scopes.
   - Inspects immutable audit logs and validates cryptographic hash chains.
2. **`GOVERNMENT_OFFICER` (Revenue Officer / Tehsildar / Municipal Joint Commissioner):**
   - High-privilege statutory decision-maker.
   - Reviews detected spatial discrepancies (footprint encroachments, height deviations).
   - Approves, modifies, or dismisses conflicts with legally binding digital justifications.
   - Authorizes the promotion of derived 3D models into verified 3D ULPIN records.
3. **`SURVEYOR` (Empanelled Field Surveyor / GIS Engineer):**
   - Ingests raw survey assets: Electronic Total Station (ETS) points, drone orthomosaics, raw cadastral shapefiles.
   - Inspects automated building footprint extractions and adjusts boundary vertices to match ground control points (GCPs).
   - Submits ground verification reports for officer adjudication.
4. **`PLANNER` (Town Planning Authority / Urban Development Official):**
   - Conducts multi-layer spatial analysis: Floor Area Ratio (FAR/FSI) compliance, green cover ratios, zoning setbacks.
   - Analyzes infrastructure carrying capacity against vertical residential unit density.
5. **`ANALYST` (Geospatial Data Analyst):**
   - Executes natural language queries through the AI Spatial Investigator.
   - Generates municipal reports, temporal change detection statistics, and quality score evaluations.
6. **`PUBLIC_USER` (Citizen / Land Buyer / Tenant):**
   - Restricted, read-only access.
   - Can search properties by 14-digit 2D ULPIN or vertical 3D ULPIN.
   - Views verified 3D building envelopes, floor footprints, and registered civic utility connections.
   - Unverified conflicts, internal audit histories, and sensitive subsurface utility depths remain masked.

---

## 3. RBAC Permission Matrix

| Resource / Capability | `ADMIN` | `GOVERNMENT_OFFICER` | `SURVEYOR` | `PLANNER` | `ANALYST` | `PUBLIC_USER` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **View 2D/3D Cadastral Map** | Full | Full | Full | Full | Full | Restricted |
| **Search by 2D/3D ULPIN** | Full | Full | Full | Full | Full | Certified Only |
| **Upload Raw Survey Datasets**| Yes | No | Yes | No | No | No |
| **Trigger 3D Building Extrusion**| Yes | No | Yes | Yes | No | No |
| **Edit Cadastral/Building Vertices**| Yes | With Justification | Yes | No | No | No |
| **View Detected Spatial Conflicts** | Full | Full | Assigned | Full | Full | Hidden |
| **Adjudicate Conflicts (Approve/Reject)**| No | **Yes** | No | No | No | No |
| **Execute AI Spatial Queries** | Full | Full | Full | Full | Full | Filtered |
| **Access Sensitive Subsurface Utilities**| Full | Full | No | Full | Read-Only | **Masked** |
| **Inspect Immutable Audit Logs** | **Full / Verify**| Read-Only | Personal | Personal | No | No |
| **Manage Users & Role Assignment**| **Yes** | No | No | No | No | No |

---

## 4. Future Authentication & Session Architecture

When implemented in Phase 2, the authentication boundary will leverage standard sovereign-grade identity patterns:

### 4.1 Identity Token Standards
- **Token Mechanism:** Stateless JSON Web Tokens (JWT) using asymmetric RS256 / EdDSA cryptographic signatures.
- **Payload Schema:**
```json
{
  "sub": "usr_94a3b8e2-411a-4c9f-8561-12f7a94b8e21",
  "name": "Arunachalam Muruganantham",
  "email": "a.murugan@bbmp.gov.in",
  "role": "GOVERNMENT_OFFICER",
  "jurisdiction": {
    "city_code": "BLR",
    "region_codes": ["WARD-142", "WARD-143"]
  },
  "exp": 1774358400,
  "iss": "https://auth.astatine.tantrakatha.gov.in"
}
```

### 4.2 Single Sign-On (SSO) Integration Strategy
The architecture is pre-configured to interface with National Government SSO portals:
- **Jan Parichay / MeriPehchan:** Single National SSO platform for citizen and officer authentication across central and state government portals.
- **DigiLocker Integration:** Citizen verification of identity and Aadhaar-linked property ownership certificates.
- **OAuth2 / OIDC Authorization Code Flow with PKCE:** Enforced on the Next.js web application for secure browser token acquisition.

### 4.3 Backend FastAPI Enforcement Pattern
Endpoints will declare role dependencies via FastAPI's dependency injection system:
```python
# Architecture Blueprint Pattern (To be implemented in Phase 2)
# @router.post("/verification/decide")
# async def decide_verification(
#     payload: VerificationDecisionRequest,
#     current_user: User = Security(require_roles(["GOVERNMENT_OFFICER"]))
# ): ...
```
All route handlers will enforce multi-tenant city isolation, ensuring officers cannot modify records outside their authorized municipal jurisdiction.
