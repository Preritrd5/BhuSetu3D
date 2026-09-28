"""
BhuSetu 3D Evidence Vault, Provenance & Confidence System API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 8: Evidence, Provenance & Source Tracking
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.evidence import (
    EvidenceItem,
    EvidenceListResponse,
    ProvenanceChainResponse,
    ConfidenceBreakdownResponse,
    PropertyEvidenceResponse,
    DatasetEvidenceResponse,
)
from app.services.evidence_service import EvidenceService

# Main Evidence Vault router
router = APIRouter(prefix="/evidence", tags=["Evidence & Provenance Vault"])

# Property-scoped Evidence & Lineage router
property_evidence_router = APIRouter(prefix="/properties", tags=["Property Evidence & Lineage"])

# Dataset-scoped Evidence router
dataset_evidence_router = APIRouter(prefix="/datasets", tags=["Dataset Evidence Tracking"])


# -----------------------------------------------------------------------------
# 1. EVIDENCE VAULT ENDPOINTS
# -----------------------------------------------------------------------------

@router.get(
    "",
    response_model=EvidenceListResponse,
    summary="List Evidence Records",
    description="Retrieve paginated evidence items with multi-dimensional filtering across classifications, sources, and status.",
)
async def list_evidence(
    entity_type: Optional[str] = Query(None, description="Entity type: PARCEL, BUILDING, FLOOR, UNIT, INFRASTRUCTURE"),
    entity_id: Optional[uuid.UUID] = Query(None, description="Filter by specific entity UUID"),
    source_type: Optional[str] = Query(None, description="Source type category (e.g., DRONE_IMAGERY, GNSS_SURVEY, CADASTRAL_DATA)"),
    source_classification: Optional[str] = Query(None, description="Classification: OBSERVED, DERIVED, AI_ASSISTED, INFERRED, VERIFIED, UNKNOWN"),
    status: Optional[str] = Query(None, description="Evidence status: AVAILABLE, PARTIAL, UNAVAILABLE, INVALID, SUPERSEDED"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score threshold"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    items, total = await EvidenceService.get_evidence_list(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        source_type=source_type,
        source_classification=source_classification,
        status=status,
        min_confidence=min_confidence,
        page=page,
        limit=limit,
    )
    return EvidenceListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/{evidence_id}",
    response_model=EvidenceItem,
    summary="Get Evidence Item Detail",
    description="Retrieve complete metadata, dataset link, sensor details, and confidence factors for a specific evidence item.",
)
async def get_evidence_detail(
    evidence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    item = await EvidenceService.get_evidence_by_id(db=db, evidence_id=evidence_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence item with ID '{evidence_id}' not found.",
        )
    return item


# -----------------------------------------------------------------------------
# 2. PROPERTY EVIDENCE & LINEAGE ENDPOINTS
# -----------------------------------------------------------------------------

@property_evidence_router.get(
    "/{property_id}/evidence",
    response_model=PropertyEvidenceResponse,
    summary="Get Property Hierarchy Evidence",
    description="Retrieve all evidence items supporting a property across its parcel, buildings, floors, units, and utilities, with missing evidence analysis.",
)
async def get_property_evidence_hierarchy(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    result = await EvidenceService.get_property_evidence(db=db, property_id=property_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID '{property_id}' not found.",
        )
    return result


@property_evidence_router.get(
    "/{property_id}/provenance",
    response_model=ProvenanceChainResponse,
    summary="Get Property Lineage DAG",
    description="Retrieve the sequential provenance lineage chain: Ingestion -> AI Extraction -> Vertical Slicing -> 3D ULPIN Assignment.",
)
async def get_property_provenance_chain(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    result = await EvidenceService.get_property_provenance(db=db, property_id=property_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID '{property_id}' not found.",
        )
    return result


@property_evidence_router.get(
    "/{property_id}/confidence",
    response_model=ConfidenceBreakdownResponse,
    summary="Get Property Confidence Breakdown",
    description="Retrieve composite confidence score, component scores, supporting and limiting factors. Strictly decouples confidence from statutory verification.",
)
async def get_property_confidence_breakdown(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    result = await EvidenceService.get_property_confidence(db=db, property_id=property_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID '{property_id}' not found.",
        )
    return result


# -----------------------------------------------------------------------------
# 3. DATASET EVIDENCE ENDPOINT
# -----------------------------------------------------------------------------

@dataset_evidence_router.get(
    "/{dataset_id}/evidence",
    response_model=DatasetEvidenceResponse,
    summary="Get Dataset Evidence Items",
    description="Query all evidence items originating from a specific ingested dataset.",
)
async def get_dataset_evidence(
    dataset_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    result = await EvidenceService.get_dataset_evidence(
        db=db,
        dataset_id=dataset_id,
        page=page,
        limit=limit,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found.",
        )
    return result
