"""
BhuSetu 3D Deterministic Data Quality Intelligence Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish

Evaluates ULPIN-oriented record quality across 7 orthogonal components:
1. Completeness (20%)
2. Spatial Validity (20%)
3. Attribute Consistency (15%)
4. Provenance Coverage (15%)
5. Evidence Coverage (15%)
6. Verification Coverage (10%)
7. Temporal Coverage (5%)

All scores are 100% deterministic, explainable, reproducible, and persisted with scoring version.
NEVER uses opaque AI or LLM to determine quality scores.
"""
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.shape import to_shape
from shapely.geometry.base import BaseGeometry

from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.infrastructure import Infrastructure
from app.models.provenance import Evidence, ProvenanceRecord, Conflict, VerificationRecord
from app.models.temporal import PropertyStateVersion
from app.models.quality import QualityScoreSnapshot, QualityIssue
from app.schemas.quality import (
    QualityCategory,
    QualitySeverity,
    QualityIssueStatus,
    RuleEvaluationResult,
    QualityComponentScores,
    QualityWeights,
    QualityScoreResponse,
    QualityIssueItem,
    QualitySnapshotItem,
    QualityHistoryResponse,
)
from app.core.logging import logger


SCORING_VERSION_CURRENT = "quality_v1"
DEFAULT_WEIGHTS = QualityWeights()


class QualityEngine:
    """
    Core Data Quality Engine.
    Executes explicit rule sets against spatial domain entities and calculates explainable scores.
    """

    @staticmethod
    def _to_shapely(geom_attr: Any) -> Optional[BaseGeometry]:
        if geom_attr is None:
            return None
        try:
            if isinstance(geom_attr, BaseGeometry):
                return geom_attr
            elif isinstance(geom_attr, str):
                import shapely.wkt
                import shapely.geometry
                import json
                cleaned = geom_attr
                if "SRID=" in cleaned:
                    cleaned = cleaned.split(";", 1)[-1]
                if cleaned.startswith("{"):
                    return shapely.geometry.shape(json.loads(cleaned))
                return shapely.wkt.loads(cleaned)
            else:
                return to_shape(geom_attr)
        except Exception as e:
            logger.warning(f"Error parsing geometry in QualityEngine: {e}")
    @staticmethod
    def _get_quality_label(overall_score: float) -> str:
        if overall_score >= 85.0:
            return "High data quality"
        elif overall_score >= 70.0:
            return "Moderate data quality"
        elif overall_score >= 50.0:
            return "Fair data quality"
        else:
            return "Needs data attention"

    @classmethod
    async def evaluate_parcel_quality(
        cls,
        db: AsyncSession,
        parcel_id: UUID,
        persist_snapshot: bool = True,
        user_id: Optional[UUID] = None,
    ) -> QualityScoreResponse:
        """
        Calculates explainable quality score for a Cadastral Parcel.
        """
        stmt = select(Parcel).where(Parcel.id == parcel_id)
        res = await db.execute(stmt)
        parcel = res.scalar_one_or_none()
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parcel with ID '{parcel_id}' not found.",
            )

        rules: List[RuleEvaluationResult] = []
        issues_to_create: List[QualityIssue] = []
        missing_fields: List[str] = []

        # -------------------------------------------------------------
        # 1. COMPLETENESS (20%)
        # -------------------------------------------------------------
        comp_score = 0.0
        # Check: Geometry present
        if parcel.geom_2d is not None:
            comp_score += 25.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-001",
                rule_name="Parcel Boundary Geometry Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=25.0,
                max_contribution=25.0,
                message="Authoritative 2D cadastral polygon is defined.",
            ))
        else:
            missing_fields.append("geom_2d")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-001",
                rule_name="Parcel Boundary Geometry Present",
                category=QualityCategory.COMPLETENESS,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=25.0,
                message="Parcel boundary geometry is missing.",
            ))
            issues_to_create.append(QualityIssue(
                entity_type="PARCEL",
                entity_id=parcel.id,
                category=QualityCategory.COMPLETENESS.value,
                severity=QualitySeverity.ERROR.value,
                rule_code="QUAL-COMP-001",
                message="Missing cadastral polygon geometry.",
                action_url=f"/properties?id={parcel.id}",
            ))

        # Check: ULPIN-2D or Survey Number present
        if parcel.ulpin_2d:
            comp_score += 35.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-002",
                rule_name="Standard ULPIN Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=35.0,
                max_contribution=35.0,
                message=f"Standard 14-digit ULPIN '{parcel.ulpin_2d}' is registered.",
            ))
        elif parcel.survey_number:
            comp_score += 20.0
            missing_fields.append("ulpin_2d")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-002",
                rule_name="Standard ULPIN Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=20.0,
                max_contribution=35.0,
                message=f"Revenue survey number '{parcel.survey_number}' present, but standard ULPIN pending.",
            ))
        else:
            missing_fields.append("ulpin_2d")
            missing_fields.append("survey_number")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-002",
                rule_name="Standard ULPIN Present",
                category=QualityCategory.COMPLETENESS,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=35.0,
                message="Both ULPIN and revenue survey number are missing.",
            ))
            issues_to_create.append(QualityIssue(
                entity_type="PARCEL",
                entity_id=parcel.id,
                category=QualityCategory.COMPLETENESS.value,
                severity=QualitySeverity.WARNING.value,
                rule_code="QUAL-COMP-002",
                message="Missing standard ULPIN identifier.",
                action_url=f"/properties?id={parcel.id}",
            ))

        # Check: Area attributes present
        if parcel.computed_area_sqm or parcel.recorded_area_sqm:
            comp_score += 20.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-003",
                rule_name="Cadastral Area Attributes Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=20.0,
                max_contribution=20.0,
                message="Recorded or computed parcel area is defined.",
            ))
        else:
            missing_fields.append("computed_area_sqm")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-003",
                rule_name="Cadastral Area Attributes Present",
                category=QualityCategory.COMPLETENESS,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=20.0,
                message="Parcel area attributes are missing.",
            ))

        # Check: Land use code present
        if parcel.land_use:
            comp_score += 20.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-004",
                rule_name="Municipal Land Use Classified",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=20.0,
                max_contribution=20.0,
                message=f"Land use category '{parcel.land_use}' recorded.",
            ))
        else:
            missing_fields.append("land_use")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-004",
                rule_name="Municipal Land Use Classified",
                category=QualityCategory.COMPLETENESS,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=20.0,
                message="Municipal land use category is unclassified.",
            ))

        # -------------------------------------------------------------
        # 2. SPATIAL VALIDITY (20%)
        # -------------------------------------------------------------
        spat_score = 0.0
        if parcel.geom_2d is not None:
            try:
                geom = cls._to_shapely(parcel.geom_2d)
                if geom and geom.is_valid:
                    spat_score += 60.0
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-001",
                        rule_name="Geometry Structural Validity",
                        category=QualityCategory.SPATIAL,
                        status="PASS",
                        score_contribution=60.0,
                        max_contribution=60.0,
                        message="Polygon topology is closed and free of self-intersections.",
                    ))
                else:
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-001",
                        rule_name="Geometry Structural Validity",
                        category=QualityCategory.SPATIAL,
                        status="FAIL",
                        score_contribution=0.0,
                        max_contribution=60.0,
                        message="Geometry has self-intersection or open ring topology.",
                    ))
                    issues_to_create.append(QualityIssue(
                        entity_type="PARCEL",
                        entity_id=parcel.id,
                        category=QualityCategory.SPATIAL.value,
                        severity=QualitySeverity.ERROR.value,
                        rule_code="QUAL-SPAT-001",
                        message="Invalid polygon geometry topology.",
                        action_url=f"/spatial-analysis?id={parcel.id}",
                    ))

                if not geom.is_empty and geom.area > 0:
                    spat_score += 40.0
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-002",
                        rule_name="Non-Empty Positive Polygon Area",
                        category=QualityCategory.SPATIAL,
                        status="PASS",
                        score_contribution=40.0,
                        max_contribution=40.0,
                        message="Geometry is non-empty with valid non-zero surface area.",
                    ))
                else:
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-002",
                        rule_name="Non-Empty Positive Polygon Area",
                        category=QualityCategory.SPATIAL,
                        status="FAIL",
                        score_contribution=0.0,
                        max_contribution=40.0,
                        message="Geometry is empty or degenerate (zero area).",
                    ))
            except Exception as e:
                logger.warning(f"Error checking Shapely validity: {e}")
                spat_score = 50.0  # Conservative partial score if parser error
        else:
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-SPAT-001",
                rule_name="Geometry Structural Validity",
                category=QualityCategory.SPATIAL,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=100.0,
                message="Cannot evaluate spatial validity: geometry missing.",
            ))

        # -------------------------------------------------------------
        # 3. ATTRIBUTE CONSISTENCY (15%)
        # -------------------------------------------------------------
        attr_score = 0.0
        # Positive computed area
        if parcel.computed_area_sqm and float(parcel.computed_area_sqm) > 0:
            attr_score += 50.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-001",
                rule_name="Positive Geometric Area",
                category=QualityCategory.ATTRIBUTE,
                status="PASS",
                score_contribution=50.0,
                max_contribution=50.0,
                message=f"Computed area ({parcel.computed_area_sqm} m²) is positive.",
            ))
        else:
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-001",
                rule_name="Positive Geometric Area",
                category=QualityCategory.ATTRIBUTE,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=50.0,
                message="Computed area must be greater than zero.",
            ))

        # City reference exists
        if parcel.city_id:
            attr_score += 50.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-002",
                rule_name="Municipal City Hierarchy Linked",
                category=QualityCategory.ATTRIBUTE,
                status="PASS",
                score_contribution=50.0,
                max_contribution=50.0,
                message="Parcel correctly anchors to municipal city boundary.",
            ))
        else:
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-002",
                rule_name="Municipal City Hierarchy Linked",
                category=QualityCategory.ATTRIBUTE,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=50.0,
                message="Orphan parcel: city reference missing.",
            ))

        # -------------------------------------------------------------
        # 4. PROVENANCE COVERAGE (15%)
        # -------------------------------------------------------------
        prov_stmt = select(func.count(ProvenanceRecord.id)).where(
            and_(
                ProvenanceRecord.target_entity_type == "PARCEL",
                ProvenanceRecord.target_entity_id == parcel.id,
            )
        )
        prov_count = (await db.execute(prov_stmt)).scalar() or 0
        prov_score = 100.0 if prov_count > 0 else 0.0
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-PROV-001",
            rule_name="Authoritative Provenance Lineage Linked",
            category=QualityCategory.PROVENANCE,
            status="PASS" if prov_count > 0 else "FAIL",
            score_contribution=prov_score,
            max_contribution=100.0,
            message=f"{prov_count} provenance lineage record(s) linked." if prov_count > 0 else "No provenance chain recorded.",
        ))
        if prov_count == 0:
            issues_to_create.append(QualityIssue(
                entity_type="PARCEL",
                entity_id=parcel.id,
                category=QualityCategory.PROVENANCE.value,
                severity=QualitySeverity.WARNING.value,
                rule_code="QUAL-PROV-001",
                message="Missing authoritative provenance lineage.",
                action_url=f"/evidence?entity_id={parcel.id}",
            ))

        # -------------------------------------------------------------
        # 5. EVIDENCE COVERAGE (15%)
        # -------------------------------------------------------------
        ev_stmt = select(func.count(Evidence.id)).where(
            and_(
                Evidence.entity_type == "PARCEL",
                Evidence.entity_id == parcel.id,
            )
        )
        ev_count = (await db.execute(ev_stmt)).scalar() or 0
        ev_score = 100.0 if ev_count >= 1 else 0.0
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-EVID-001",
            rule_name="Sensor Survey Evidence Attached",
            category=QualityCategory.EVIDENCE,
            status="PASS" if ev_count > 0 else "FAIL",
            score_contribution=ev_score,
            max_contribution=100.0,
            message=f"{ev_count} sensor evidence item(s) attached." if ev_count > 0 else "No sensor survey evidence attached.",
        ))
        if ev_count == 0:
            issues_to_create.append(QualityIssue(
                entity_type="PARCEL",
                entity_id=parcel.id,
                category=QualityCategory.EVIDENCE.value,
                severity=QualitySeverity.WARNING.value,
                rule_code="QUAL-EVID-001",
                message="No sensor evidence records attached to this parcel.",
                action_url=f"/evidence?entity_id={parcel.id}",
            ))

        # -------------------------------------------------------------
        # 6. VERIFICATION COVERAGE (10%)
        # -------------------------------------------------------------
        # Check if any verification decisions have been confirmed in Phase 11
        v_stmt = select(VerificationRecord).where(
            and_(
                VerificationRecord.entity_type == "PARCEL",
                VerificationRecord.entity_id == parcel.id,
            )
        ).order_by(desc(VerificationRecord.created_at))
        v_res = await db.execute(v_stmt)
        last_v = v_res.scalars().first()

        verif_score = 0.0
        is_verified = False
        if last_v:
            if last_v.new_status == "VERIFIED":
                verif_score = 100.0
                is_verified = True
            elif last_v.new_status == "IN_REVIEW":
                verif_score = 50.0
            elif last_v.new_status in ("UNREVIEWED", "NEEDS_MORE_EVIDENCE"):
                verif_score = 25.0
            elif last_v.new_status == "REJECTED":
                verif_score = 0.0  # Rejected is explicitly NOT verified
        else:
            verif_score = 30.0  # Unreviewed default baseline

        rules.append(RuleEvaluationResult(
            rule_code="QUAL-VERIF-001",
            rule_name="Maker-Checker Statutory Review",
            category=QualityCategory.VERIFICATION,
            status="PASS" if is_verified else "FAIL",
            score_contribution=verif_score,
            max_contribution=100.0,
            message=f"Statutory verification status: {last_v.new_status if last_v else 'UNREVIEWED'}.",
        ))

        # -------------------------------------------------------------
        # 7. TEMPORAL COVERAGE (5%)
        # -------------------------------------------------------------
        temp_stmt = select(func.count(PropertyStateVersion.id)).where(
            and_(
                PropertyStateVersion.entity_type == "PARCEL",
                PropertyStateVersion.entity_id == parcel.id,
            )
        )
        temp_count = (await db.execute(temp_stmt)).scalar() or 0
        temp_score = 100.0 if temp_count >= 1 else 50.0  # Current-only is not severely penalized
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-TEMP-001",
            rule_name="4D Temporal Epoch Versioning",
            category=QualityCategory.TEMPORAL,
            status="PASS",
            score_contribution=temp_score,
            max_contribution=100.0,
            message=f"{temp_count} discrete observation epoch(s) recorded." if temp_count > 0 else "Single current epoch observation recorded.",
        ))

        # -------------------------------------------------------------
        # WEIGHTED CALCULATION
        # -------------------------------------------------------------
        w = DEFAULT_WEIGHTS
        components = QualityComponentScores(
            completeness=round(comp_score, 1),
            spatial_validity=round(spat_score, 1),
            attribute_consistency=round(attr_score, 1),
            provenance_coverage=round(prov_score, 1),
            evidence_coverage=round(ev_score, 1),
            verification_coverage=round(verif_score, 1),
            temporal_coverage=round(temp_score, 1),
        )

        overall = (
            components.completeness * w.completeness
            + components.spatial_validity * w.spatial_validity
            + components.attribute_consistency * w.attribute_consistency
            + components.provenance_coverage * w.provenance_coverage
            + components.evidence_coverage * w.evidence_coverage
            + components.verification_coverage * w.verification_coverage
            + components.temporal_coverage * w.temporal_coverage
        )
        overall_score = round(overall, 1)

        # -------------------------------------------------------------
        # DEDUPLICATE & PERSIST ISSUES
        # -------------------------------------------------------------
        active_issues_items: List[QualityIssueItem] = []
        for issue in issues_to_create:
            dedup_stmt = select(QualityIssue).where(
                and_(
                    QualityIssue.entity_type == issue.entity_type,
                    QualityIssue.entity_id == issue.entity_id,
                    QualityIssue.rule_code == issue.rule_code,
                    QualityIssue.category == issue.category,
                )
            )
            existing = (await db.execute(dedup_stmt)).scalar_one_or_none()
            if not existing:
                db.add(issue)
                await db.flush()
                active_issues_items.append(QualityIssueItem.model_validate(issue))
            else:
                active_issues_items.append(QualityIssueItem.model_validate(existing))

        # -------------------------------------------------------------
        # SNAPSHOT PERSISTENCE
        # -------------------------------------------------------------
        now_utc = datetime.now(timezone.utc)
        if persist_snapshot:
            snapshot = QualityScoreSnapshot(
                id=uuid.uuid4(),
                entity_type="PARCEL",
                entity_id=parcel.id,
                overall_score=Decimal(str(overall_score)),
                component_scores=components.model_dump(),
                weights_used=w.model_dump(),
                rule_results=[r.model_dump() for r in rules],
                missing_fields=missing_fields,
                scoring_version=SCORING_VERSION_CURRENT,
                calculated_at=now_utc,
                calculated_by=user_id,
            )
            db.add(snapshot)
            await db.commit()

        return QualityScoreResponse(
            entity_type="PARCEL",
            entity_id=parcel.id,
            entity_identifier=parcel.ulpin_2d or parcel.survey_number,
            overall_score=overall_score,
            quality_label=cls._get_quality_label(overall_score),
            component_scores=components,
            weights_used=w,
            rules_evaluated=rules,
            missing_fields=missing_fields,
            active_issues=active_issues_items,
            evidence_count=ev_count,
            is_verified=is_verified,
            scoring_version=SCORING_VERSION_CURRENT,
            calculated_at=now_utc,
        )

    @classmethod
    async def evaluate_building_quality(
        cls,
        db: AsyncSession,
        building_id: UUID,
        persist_snapshot: bool = True,
        user_id: Optional[UUID] = None,
    ) -> QualityScoreResponse:
        """
        Calculates explainable quality score for a 3D Building structure.
        """
        stmt = select(Building).where(Building.id == building_id)
        res = await db.execute(stmt)
        bld = res.scalar_one_or_none()
        if not bld:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Building with ID '{building_id}' not found.",
            )

        rules: List[RuleEvaluationResult] = []
        issues_to_create: List[QualityIssue] = []
        missing_fields: List[str] = []

        # 1. COMPLETENESS (20%)
        comp_score = 0.0
        if bld.footprint_geom is not None:
            comp_score += 25.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-001",
                rule_name="Building 2D Footprint Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=25.0,
                max_contribution=25.0,
                message="Building footprint polygon is defined.",
            ))
        else:
            missing_fields.append("footprint_geom")
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-001",
                rule_name="Building 2D Footprint Present",
                category=QualityCategory.COMPLETENESS,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=25.0,
                message="Building footprint geometry is missing.",
            ))
            issues_to_create.append(QualityIssue(
                entity_type="BUILDING",
                entity_id=bld.id,
                category=QualityCategory.COMPLETENESS.value,
                severity=QualitySeverity.ERROR.value,
                rule_code="QUAL-COMP-001",
                message="Missing building footprint geometry.",
                action_url=f"/properties?building_id={bld.id}",
            ))

        if bld.building_code:
            comp_score += 25.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-002",
                rule_name="Building Identifier Code Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=25.0,
                max_contribution=25.0,
                message=f"Building code '{bld.building_code}' is registered.",
            ))
        else:
            missing_fields.append("building_code")

        if bld.building_height is not None and float(bld.building_height) > 0:
            comp_score += 25.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-003",
                rule_name="LiDAR / Extruded Height Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=25.0,
                max_contribution=25.0,
                message=f"Structural height of {bld.building_height}m recorded.",
            ))
        else:
            missing_fields.append("building_height")

        if bld.detected_floors is not None and int(bld.detected_floors) > 0:
            comp_score += 25.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-COMP-004",
                rule_name="Vertical Floor Count Present",
                category=QualityCategory.COMPLETENESS,
                status="PASS",
                score_contribution=25.0,
                max_contribution=25.0,
                message=f"{bld.detected_floors} vertical floors detected.",
            ))
        else:
            missing_fields.append("detected_floors")

        # 2. SPATIAL VALIDITY (20%)
        spat_score = 0.0
        if bld.footprint_geom is not None:
            try:
                geom = cls._to_shapely(bld.footprint_geom)
                if geom and geom.is_valid:
                    spat_score += 60.0
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-001",
                        rule_name="Footprint Topological Validity",
                        category=QualityCategory.SPATIAL,
                        status="PASS",
                        score_contribution=60.0,
                        max_contribution=60.0,
                        message="Building footprint polygon is structurally valid.",
                    ))
                else:
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-001",
                        rule_name="Footprint Topological Validity",
                        category=QualityCategory.SPATIAL,
                        status="FAIL",
                        score_contribution=0.0,
                        max_contribution=60.0,
                        message="Building footprint has topological errors.",
                    ))

                if bld.geom_3d is not None:
                    spat_score += 40.0
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-002",
                        rule_name="3D PolyhedralSurfaceZ Envelope Available",
                        category=QualityCategory.SPATIAL,
                        status="PASS",
                        score_contribution=40.0,
                        max_contribution=40.0,
                        message="Full 3D polyhedral envelope geometry available.",
                    ))
                else:
                    # Missing 3D reduces component score without making whole building invalid
                    rules.append(RuleEvaluationResult(
                        rule_code="QUAL-SPAT-002",
                        rule_name="3D PolyhedralSurfaceZ Envelope Available",
                        category=QualityCategory.SPATIAL,
                        status="NOT_APPLICABLE",
                        score_contribution=20.0,
                        max_contribution=40.0,
                        message="3D polyhedral mesh pending; 2.5D extrusion available.",
                    ))
                    spat_score += 20.0
            except Exception as e:
                logger.warning(f"Error checking building geometry: {e}")
                spat_score = 60.0
        else:
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-SPAT-001",
                rule_name="Footprint Topological Validity",
                category=QualityCategory.SPATIAL,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=100.0,
                message="Cannot evaluate: footprint geometry missing.",
            ))

        # 3. ATTRIBUTE CONSISTENCY (15%)
        attr_score = 0.0
        if bld.detected_floors and int(bld.detected_floors) > 0 and bld.building_height and float(bld.building_height) > 0:
            attr_score += 50.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-001",
                rule_name="Logical Height & Floor Consistency",
                category=QualityCategory.ATTRIBUTE,
                status="PASS",
                score_contribution=50.0,
                max_contribution=50.0,
                message="Floors and height are mutually positive and plausible.",
            ))
        else:
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-001",
                rule_name="Logical Height & Floor Consistency",
                category=QualityCategory.ATTRIBUTE,
                status="FAIL",
                score_contribution=0.0,
                max_contribution=50.0,
                message="Building height or floor count is non-positive.",
            ))

        # Anchor parcel exists
        if bld.parcel_id:
            attr_score += 50.0
            rules.append(RuleEvaluationResult(
                rule_code="QUAL-ATTR-002",
                rule_name="Parent Cadastral Parcel Attached",
                category=QualityCategory.ATTRIBUTE,
                status="PASS",
                score_contribution=50.0,
                max_contribution=50.0,
                message="Building anchors to parent cadastral parcel.",
            ))

        # 4. PROVENANCE COVERAGE (15%)
        prov_stmt = select(func.count(ProvenanceRecord.id)).where(
            and_(
                ProvenanceRecord.target_entity_type == "BUILDING",
                ProvenanceRecord.target_entity_id == bld.id,
            )
        )
        prov_count = (await db.execute(prov_stmt)).scalar() or 0
        prov_score = 100.0 if prov_count > 0 else 0.0
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-PROV-001",
            rule_name="Building Extraction Lineage Present",
            category=QualityCategory.PROVENANCE,
            status="PASS" if prov_count > 0 else "FAIL",
            score_contribution=prov_score,
            max_contribution=100.0,
            message=f"{prov_count} provenance record(s) linked." if prov_count > 0 else "Extraction lineage missing.",
        ))

        # 5. EVIDENCE COVERAGE (15%)
        ev_stmt = select(func.count(Evidence.id)).where(
            and_(
                Evidence.entity_type == "BUILDING",
                Evidence.entity_id == bld.id,
            )
        )
        ev_count = (await db.execute(ev_stmt)).scalar() or 0
        ev_score = 100.0 if ev_count >= 1 else 0.0
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-EVID-001",
            rule_name="Aerial / LiDAR Evidence Attached",
            category=QualityCategory.EVIDENCE,
            status="PASS" if ev_count > 0 else "FAIL",
            score_contribution=ev_score,
            max_contribution=100.0,
            message=f"{ev_count} evidence record(s) attached.",
        ))
        if ev_count == 0:
            issues_to_create.append(QualityIssue(
                entity_type="BUILDING",
                entity_id=bld.id,
                category=QualityCategory.EVIDENCE.value,
                severity=QualitySeverity.WARNING.value,
                rule_code="QUAL-EVID-001",
                message="No sensor evidence attached to this building.",
                action_url=f"/evidence?entity_id={bld.id}",
            ))

        # 6. VERIFICATION COVERAGE (10%)
        v_stmt = select(VerificationRecord).where(
            and_(
                VerificationRecord.entity_type == "BUILDING",
                VerificationRecord.entity_id == bld.id,
            )
        ).order_by(desc(VerificationRecord.created_at))
        last_v = (await db.execute(v_stmt)).scalars().first()

        verif_score = 0.0
        is_verified = False
        if last_v:
            if last_v.new_status == "VERIFIED":
                verif_score = 100.0
                is_verified = True
            elif last_v.new_status == "IN_REVIEW":
                verif_score = 50.0
            elif last_v.new_status in ("UNREVIEWED", "NEEDS_MORE_EVIDENCE"):
                verif_score = 25.0
            elif last_v.new_status == "REJECTED":
                verif_score = 0.0
        else:
            verif_score = 30.0

        rules.append(RuleEvaluationResult(
            rule_code="QUAL-VERIF-001",
            rule_name="Maker-Checker Review Verification",
            category=QualityCategory.VERIFICATION,
            status="PASS" if is_verified else "FAIL",
            score_contribution=verif_score,
            max_contribution=100.0,
            message=f"Status: {last_v.new_status if last_v else 'UNREVIEWED'}.",
        ))

        # 7. TEMPORAL COVERAGE (5%)
        temp_stmt = select(func.count(PropertyStateVersion.id)).where(
            and_(
                PropertyStateVersion.entity_type == "BUILDING",
                PropertyStateVersion.entity_id == bld.id,
            )
        )
        temp_count = (await db.execute(temp_stmt)).scalar() or 0
        temp_score = 100.0 if temp_count >= 1 else 50.0
        rules.append(RuleEvaluationResult(
            rule_code="QUAL-TEMP-001",
            rule_name="Temporal Epoch History Tracked",
            category=QualityCategory.TEMPORAL,
            status="PASS",
            score_contribution=temp_score,
            max_contribution=100.0,
            message=f"{temp_count} state versions recorded.",
        ))

        # WEIGHTED CALCULATION
        w = DEFAULT_WEIGHTS
        components = QualityComponentScores(
            completeness=round(comp_score, 1),
            spatial_validity=round(spat_score, 1),
            attribute_consistency=round(attr_score, 1),
            provenance_coverage=round(prov_score, 1),
            evidence_coverage=round(ev_score, 1),
            verification_coverage=round(verif_score, 1),
            temporal_coverage=round(temp_score, 1),
        )

        overall = (
            components.completeness * w.completeness
            + components.spatial_validity * w.spatial_validity
            + components.attribute_consistency * w.attribute_consistency
            + components.provenance_coverage * w.provenance_coverage
            + components.evidence_coverage * w.evidence_coverage
            + components.verification_coverage * w.verification_coverage
            + components.temporal_coverage * w.temporal_coverage
        )
        overall_score = round(overall, 1)

        # Deduplicate & Persist Issues
        active_issues_items: List[QualityIssueItem] = []
        for issue in issues_to_create:
            dedup_stmt = select(QualityIssue).where(
                and_(
                    QualityIssue.entity_type == issue.entity_type,
                    QualityIssue.entity_id == issue.entity_id,
                    QualityIssue.rule_code == issue.rule_code,
                    QualityIssue.category == issue.category,
                )
            )
            existing = (await db.execute(dedup_stmt)).scalar_one_or_none()
            if not existing:
                db.add(issue)
                await db.flush()
                active_issues_items.append(QualityIssueItem.model_validate(issue))
            else:
                active_issues_items.append(QualityIssueItem.model_validate(existing))

        now_utc = datetime.now(timezone.utc)
        if persist_snapshot:
            snapshot = QualityScoreSnapshot(
                id=uuid.uuid4(),
                entity_type="BUILDING",
                entity_id=bld.id,
                overall_score=Decimal(str(overall_score)),
                component_scores=components.model_dump(),
                weights_used=w.model_dump(),
                rule_results=[r.model_dump() for r in rules],
                missing_fields=missing_fields,
                scoring_version=SCORING_VERSION_CURRENT,
                calculated_at=now_utc,
                calculated_by=user_id,
            )
            db.add(snapshot)
            await db.commit()

        return QualityScoreResponse(
            entity_type="BUILDING",
            entity_id=bld.id,
            entity_identifier=bld.building_code or bld.name,
            overall_score=overall_score,
            quality_label=cls._get_quality_label(overall_score),
            component_scores=components,
            weights_used=w,
            rules_evaluated=rules,
            missing_fields=missing_fields,
            active_issues=active_issues_items,
            evidence_count=ev_count,
            is_verified=is_verified,
            scoring_version=SCORING_VERSION_CURRENT,
            calculated_at=now_utc,
        )

    @classmethod
    async def get_entity_quality_history(
        cls,
        db: AsyncSession,
        entity_type: str,
        entity_id: UUID,
    ) -> QualityHistoryResponse:
        """
        Retrieves historical quality snapshots for an entity, showing score trajectory over time.
        """
        stmt = (
            select(QualityScoreSnapshot)
            .where(
                and_(
                    QualityScoreSnapshot.entity_type == entity_type.upper(),
                    QualityScoreSnapshot.entity_id == entity_id,
                )
            )
            .order_by(desc(QualityScoreSnapshot.calculated_at))
            .limit(20)
        )
        res = await db.execute(stmt)
        snapshots = list(res.scalars().all())

        if not snapshots:
            # If no persisted snapshot exists, compute on-the-fly without saving
            if entity_type.upper() == "PARCEL":
                curr = await cls.evaluate_parcel_quality(db, entity_id, persist_snapshot=False)
            else:
                curr = await cls.evaluate_building_quality(db, entity_id, persist_snapshot=False)

            return QualityHistoryResponse(
                entity_type=entity_type.upper(),
                entity_id=entity_id,
                current_score=curr.overall_score,
                previous_score=None,
                score_delta=None,
                snapshots=[],
            )

        current_score = float(snapshots[0].overall_score)
        prev_score = float(snapshots[1].overall_score) if len(snapshots) > 1 else None
        delta = round(current_score - prev_score, 1) if prev_score is not None else None

        items = [
            QualitySnapshotItem(
                id=s.id,
                overall_score=float(s.overall_score),
                component_scores=s.component_scores,
                scoring_version=s.scoring_version,
                calculated_at=s.calculated_at,
            )
            for s in snapshots
        ]

        return QualityHistoryResponse(
            entity_type=entity_type.upper(),
            entity_id=entity_id,
            current_score=current_score,
            previous_score=prev_score,
            score_delta=delta,
            snapshots=items,
        )
