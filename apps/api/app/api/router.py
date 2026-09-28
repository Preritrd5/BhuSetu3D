"""
BhuSetu 3D Main API Router
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
from fastapi import APIRouter
from app.api.routes import (
    health,
    auth,
    properties,
    ingestion,
    buildings,
    vertical_properties,
    evidence,
    conflicts,
    spatial_investigator,
    verification,
    temporal,
    analytics,
    quality,
)

api_router = APIRouter()

# Register core health endpoints
api_router.include_router(health.router)

# Register Phase 2 authentication and authorization endpoints
api_router.include_router(auth.router)

# Register Phase 3 PostGIS and Property Data Model endpoints
api_router.include_router(properties.router)

# Register Phase 4 Data Ingestion & GIS Processing Pipeline endpoints
api_router.include_router(ingestion.router)

# Register Phase 6 AI Building Extraction & 3D Model endpoints
api_router.include_router(buildings.router)

# Register Phase 7 Vertical Property Mapping & 3D ULPIN endpoints
api_router.include_router(vertical_properties.router)

# Register Phase 8 Evidence, Provenance & Source Tracking endpoints
api_router.include_router(evidence.router)
api_router.include_router(evidence.property_evidence_router)
api_router.include_router(evidence.dataset_evidence_router)

# Register Phase 9 Spatial Intelligence & Conflict Detection endpoints
api_router.include_router(conflicts.router)
api_router.include_router(conflicts.property_spatial_router)
api_router.include_router(conflicts.spatial_rules_router)

# Register Phase 10 Natural Language Spatial Query & AI Spatial Investigator endpoints
api_router.include_router(spatial_investigator.router)

# Register Phase 11 Human Verification Workflow & Audit Trail endpoints
api_router.include_router(verification.router)

# Register Phase 12 4D Property History & Infrastructure Intelligence endpoints
api_router.include_router(temporal.router)
api_router.include_router(temporal.property_temporal_router)
api_router.include_router(temporal.change_events_router)
api_router.include_router(temporal.infrastructure_router)

# Register Phase 13 Enterprise Analytics & Quality Intelligence endpoints
api_router.include_router(analytics.router)
api_router.include_router(quality.router)

