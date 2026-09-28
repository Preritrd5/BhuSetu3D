"""
BhuSetu 3D Spatial Intelligence & Conflict Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 9: Spatial Intelligence & Conflict Detection
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload
from geoalchemy2.shape import to_shape, from_shape
from geoalchemy2.elements import WKBElement
import shapely.geometry
from shapely.geometry.base import BaseGeometry

from app.models.provenance import Conflict, SpatialRule, Evidence
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.infrastructure import Infrastructure, ParcelInfrastructure
from app.schemas.conflict import (
    ConflictItem,
    ConflictListResponse,
    ConflictSummary,
    ConflictSeverity,
    ConflictStatus,
    ConflictType,
    SpatialRelationshipItem,
    SpatialRelationshipType,
    NearbyInfrastructureItem,
    NearbyInfrastructureResponse,
    PropertySpatialAnalysisResponse,
)
from app.services.rule_engine import SpatialRuleEngine, CANONICAL_RULES
from app.core.spatial import geometry_to_geojson
from app.core.logging import logger


class SpatialService:
    """
    Core Spatial Intelligence Service.
    Executes PostGIS operations, evaluates spatial rules, persists findings,
    tracks evidence/confidence, and deduplicates spatial conflicts.
    """

    @staticmethod
    def _to_shapely(geom_attr: Any) -> Optional[BaseGeometry]:
        """Converts database GeoAlchemy2 geometry / WKBElement / dict to a Shapely geometry."""
        if geom_attr is None:
            return None
        try:
            if isinstance(geom_attr, WKBElement):
                return to_shape(geom_attr)
            elif isinstance(geom_attr, BaseGeometry):
                return geom_attr
            elif isinstance(geom_attr, dict):
                return shapely.geometry.shape(geom_attr)
            elif isinstance(geom_attr, str):
                if geom_attr.startswith("{"):
                    import json
                    return shapely.geometry.shape(json.loads(geom_attr))
                return shapely.wkt.loads(geom_attr)
        except Exception as e:
            logger.warning(f"Error parsing geometry to Shapely: {e}")
        return None

    @classmethod
    def _format_conflict_item(cls, conflict: Conflict, parcel: Optional[Parcel] = None, building: Optional[Building] = None) -> ConflictItem:
        """Helper to format ORM Conflict to Pydantic ConflictItem."""
        ulpin = None
        if parcel:
            ulpin = parcel.ulpin_2d
        elif conflict.parcel:
            ulpin = conflict.parcel.ulpin_2d

        bld_code = None
        if building:
            bld_code = building.building_code
        elif conflict.building:
            bld_code = conflict.building.building_code

        geom_geojson = geometry_to_geojson(conflict.conflict_geom)

        return ConflictItem(
            id=conflict.id,
            conflict_type=conflict.conflict_type,
            severity=conflict.severity,
            status=conflict.status,
            rule_id=conflict.rule_id,
            rule_name=conflict.rule_name,
            entity_type=conflict.entity_type or "PARCEL",
            entity_id=conflict.entity_id or conflict.parcel_id,
            parcel_id=conflict.parcel_id,
            parcel_ulpin=ulpin,
            building_id=conflict.building_id,
            building_code=bld_code,
            unit_id=conflict.unit_id,
            related_entity_type=conflict.related_entity_type,
            related_entity_id=conflict.related_entity_id,
            related_entity_label=conflict.discrepancy_details.get("related_entity_label") if conflict.discrepancy_details else None,
            measured_value=float(conflict.measured_value) if conflict.measured_value is not None else (
                float(conflict.deviation_value) if conflict.deviation_value is not None else None
            ),
            threshold_value=float(conflict.threshold_value) if conflict.threshold_value is not None else None,
            measured_unit=conflict.measured_unit or "m²",
            deviation_value=float(conflict.deviation_value) if conflict.deviation_value is not None else None,
            explanation=conflict.explanation or conflict.discrepancy_details.get("description"),
            discrepancy_details=conflict.discrepancy_details or {},
            evidence_reference=conflict.evidence_reference or {},
            confidence_score=float(conflict.confidence_score) if conflict.confidence_score is not None else 0.90,
            analysis_version=conflict.analysis_version or "spatial_rules_v1",
            conflict_geom_geojson=geom_geojson,
            created_at=conflict.created_at,
            updated_at=conflict.updated_at,
        )

    @classmethod
    async def get_conflicts(
        cls,
        db: AsyncSession,
        conflict_type: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        parcel_id: Optional[uuid.UUID] = None,
        entity_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[ConflictItem], int, ConflictSummary]:
        """Query paginated conflict records with filters and summary stats."""
        stmt = (
            select(Conflict)
            .options(
                selectinload(Conflict.parcel),
                selectinload(Conflict.building),
            )
        )

        filters = []
        if conflict_type:
            filters.append(Conflict.conflict_type == conflict_type.upper())
        if severity:
            filters.append(Conflict.severity == severity.upper())
        if status:
            filters.append(Conflict.status == status.upper())
        if parcel_id:
            filters.append(or_(Conflict.parcel_id == parcel_id, Conflict.entity_id == parcel_id))
        if entity_type:
            filters.append(Conflict.entity_type == entity_type.upper())
        if min_confidence is not None:
            filters.append(Conflict.confidence_score >= Decimal(str(min_confidence)))

        if filters:
            stmt = stmt.where(and_(*filters))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        # Summary counts
        sum_stmt = select(Conflict.severity, Conflict.status, func.count(Conflict.id)).group_by(Conflict.severity, Conflict.status)
        sum_res = (await db.execute(sum_stmt)).all()

        open_cnt = 0
        high_cnt = 0
        med_cnt = 0
        low_cnt = 0
        info_cnt = 0

        for sev, st, cnt in sum_res:
            if st in (ConflictStatus.OPEN.value, ConflictStatus.REVIEW_REQUIRED.value, "PENDING_REVIEW"):
                open_cnt += cnt
                if sev == ConflictSeverity.HIGH.value:
                    high_cnt += cnt
                elif sev == ConflictSeverity.MEDIUM.value:
                    med_cnt += cnt
                elif sev == ConflictSeverity.LOW.value:
                    low_cnt += cnt
                elif sev == ConflictSeverity.INFO.value:
                    info_cnt += cnt

        summary = ConflictSummary(
            open_count=open_cnt,
            high_count=high_cnt,
            medium_count=med_cnt,
            low_count=low_cnt,
            info_count=info_cnt,
        )

        offset = (page - 1) * limit
        stmt = stmt.order_by(Conflict.created_at.desc()).offset(offset).limit(limit)

        result = await db.execute(stmt)
        conflicts = result.scalars().all()

        items = [cls._format_conflict_item(c) for c in conflicts]
        return items, total, summary

    @classmethod
    async def get_conflict_by_id(
        cls,
        db: AsyncSession,
        conflict_id: uuid.UUID,
    ) -> Optional[ConflictItem]:
        """Fetch single detailed conflict record with GeoJSON geometry and full evidence."""
        stmt = (
            select(Conflict)
            .options(
                selectinload(Conflict.parcel),
                selectinload(Conflict.building),
            )
            .where(Conflict.id == conflict_id)
        )
        res = await db.execute(stmt)
        conflict = res.scalar_one_or_none()
        if not conflict:
            return None
        return cls._format_conflict_item(conflict)

    @classmethod
    async def update_conflict_status(
        cls,
        db: AsyncSession,
        conflict_id: uuid.UUID,
        new_status: str,
        comment: Optional[str] = None,
    ) -> Optional[ConflictItem]:
        """Update conflict lifecycle status (e.g. REVIEW_REQUIRED, RESOLVED, DISMISSED)."""
        stmt = select(Conflict).where(Conflict.id == conflict_id)
        res = await db.execute(stmt)
        conflict = res.scalar_one_or_none()
        if not conflict:
            return None

        conflict.status = new_status.upper()
        if comment:
            details = dict(conflict.discrepancy_details or {})
            history = details.get("status_history", [])
            history.append({
                "status": conflict.status,
                "comment": comment,
                "timestamp": datetime.utcnow().isoformat(),
            })
            details["status_history"] = history
            conflict.discrepancy_details = details

        await db.commit()
        await db.refresh(conflict)
        return cls._format_conflict_item(conflict)

    @classmethod
    async def get_property_conflicts(
        cls,
        db: AsyncSession,
        property_id: uuid.UUID,
    ) -> List[ConflictItem]:
        """Get all conflict findings directly associated with a parcel or its child buildings."""
        stmt = (
            select(Conflict)
            .options(
                selectinload(Conflict.parcel),
                selectinload(Conflict.building),
            )
            .where(
                or_(
                    Conflict.parcel_id == property_id,
                    Conflict.entity_id == property_id,
                    Conflict.related_entity_id == property_id,
                )
            )
            .order_by(Conflict.created_at.desc())
        )
        res = await db.execute(stmt)
        conflicts = res.scalars().all()
        return [cls._format_conflict_item(c) for c in conflicts]

    @classmethod
    async def get_nearby_infrastructure(
        cls,
        db: AsyncSession,
        property_id: uuid.UUID,
        radius_meters: float = 50.0,
    ) -> NearbyInfrastructureResponse:
        """Calculates metric distance to nearby infrastructure assets within search radius."""
        parcel_stmt = select(Parcel).where(Parcel.id == property_id)
        parcel = (await db.execute(parcel_stmt)).scalar_one_or_none()
        if not parcel:
            return NearbyInfrastructureResponse(
                property_id=property_id,
                search_radius_meters=radius_meters,
                total_found=0,
                items=[],
            )

        prc_geom = cls._to_shapely(parcel.geom_2d)
        if not prc_geom:
            return NearbyInfrastructureResponse(
                property_id=property_id,
                search_radius_meters=radius_meters,
                total_found=0,
                items=[],
            )

        # Query all infrastructure in the city
        infra_stmt = select(Infrastructure).where(Infrastructure.city_id == parcel.city_id)
        infras = (await db.execute(infra_stmt)).scalars().all()

        items = []
        for inf in infras:
            inf_geom = cls._to_shapely(inf.geom_spatial)
            if not inf_geom:
                continue

            intersects = bool(prc_geom.intersects(inf_geom))
            dist = 0.0 if intersects else SpatialRuleEngine.calculate_metric_distance(prc_geom, inf_geom)

            if dist <= radius_meters:
                items.append(
                    NearbyInfrastructureItem(
                        infrastructure_id=inf.id,
                        name=inf.name,
                        utility_category=inf.utility_category,
                        is_subsurface=inf.is_subsurface,
                        depth_meters=float(inf.depth_meters) if inf.depth_meters is not None else None,
                        distance_meters=round(dist, 2),
                        intersects_property=intersects,
                        evidence_source_type=inf.evidence_source_type,
                    )
                )

        items.sort(key=lambda x: x.distance_meters)

        return NearbyInfrastructureResponse(
            property_id=property_id,
            search_radius_meters=radius_meters,
            total_found=len(items),
            items=items,
        )

    @classmethod
    async def get_property_spatial_relationships(
        cls,
        db: AsyncSession,
        property_id: uuid.UUID,
    ) -> List[SpatialRelationshipItem]:
        """Calculates all topological and metric spatial relationships for a property."""
        stmt = (
            select(Parcel)
            .options(
                selectinload(Parcel.buildings),
                selectinload(Parcel.infrastructure_associations).selectinload(ParcelInfrastructure.infrastructure)
            )
            .where(Parcel.id == property_id)
        )
        parcel = (await db.execute(stmt)).scalar_one_or_none()
        if not parcel:
            return []

        prc_geom = cls._to_shapely(parcel.geom_2d)
        if not prc_geom:
            return []

        relationships: List[SpatialRelationshipItem] = []

        # 1. Contains: Buildings
        for bld in parcel.buildings:
            bld_geom = cls._to_shapely(bld.footprint_geom)
            if bld_geom:
                is_within = bool(bld_geom.within(prc_geom))
                intersects = bool(bld_geom.intersects(prc_geom))
                rel_type = (
                    SpatialRelationshipType.CONTAINS.value
                    if is_within
                    else (SpatialRelationshipType.OVERLAPS.value if intersects else SpatialRelationshipType.DISJOINT.value)
                )
                relationships.append(
                    SpatialRelationshipItem(
                        relationship_type=rel_type,
                        target_entity_type="PARCEL",
                        target_entity_id=parcel.id,
                        related_entity_type="BUILDING",
                        related_entity_id=bld.id,
                        related_entity_label=f"Building {bld.building_code} ({bld.building_type})",
                        distance_meters=0.0 if intersects else SpatialRuleEngine.calculate_metric_distance(prc_geom, bld_geom),
                        intersection_area_sqm=SpatialRuleEngine.calculate_metric_area(bld_geom.intersection(prc_geom)) if intersects else 0.0,
                        details={"height_meters": float(bld.building_height), "floors": bld.detected_floors},
                    )
                )

        # 2. Adjacent / Touches: Neighboring Parcels
        adj_stmt = select(Parcel).where(and_(Parcel.city_id == parcel.city_id, Parcel.id != parcel.id))
        adj_parcels = (await db.execute(adj_stmt)).scalars().all()

        for other_p in adj_parcels:
            other_geom = cls._to_shapely(other_p.geom_2d)
            if not other_geom:
                continue

            if prc_geom.touches(other_geom):
                relationships.append(
                    SpatialRelationshipItem(
                        relationship_type=SpatialRelationshipType.TOUCHES.value,
                        target_entity_type="PARCEL",
                        target_entity_id=parcel.id,
                        related_entity_type="PARCEL",
                        related_entity_id=other_p.id,
                        related_entity_label=f"Adjacent Parcel {other_p.ulpin_2d} (Survey: {other_p.survey_number})",
                        distance_meters=0.0,
                        intersection_area_sqm=0.0,
                        details={"boundary_sharing": True},
                    )
                )
            elif prc_geom.intersects(other_geom):
                inter = prc_geom.intersection(other_geom)
                inter_area = SpatialRuleEngine.calculate_metric_area(inter)
                if inter_area > 0.1:
                    relationships.append(
                        SpatialRelationshipItem(
                            relationship_type=SpatialRelationshipType.OVERLAPS.value,
                            target_entity_type="PARCEL",
                            target_entity_id=parcel.id,
                            related_entity_type="PARCEL",
                            related_entity_id=other_p.id,
                            related_entity_label=f"Overlapping Parcel {other_p.ulpin_2d}",
                            distance_meters=0.0,
                            intersection_area_sqm=round(inter_area, 2),
                            details={"overlap_detected": True},
                        )
                    )

        # 3. Infrastructure Near / Intersects
        nearby_infra = await cls.get_nearby_infrastructure(db, property_id, radius_meters=30.0)
        for inf in nearby_infra.items:
            rel_type = (
                SpatialRelationshipType.INTERSECTS.value
                if inf.intersects_property
                else SpatialRelationshipType.NEAR.value
            )
            relationships.append(
                SpatialRelationshipItem(
                    relationship_type=rel_type,
                    target_entity_type="PARCEL",
                    target_entity_id=parcel.id,
                    related_entity_type="INFRASTRUCTURE",
                    related_entity_id=inf.infrastructure_id,
                    related_entity_label=f"Utility: {inf.name} ({inf.utility_category})",
                    distance_meters=inf.distance_meters,
                    intersection_area_sqm=None,
                    details={"is_subsurface": inf.is_subsurface, "depth_meters": inf.depth_meters},
                )
            )

        return relationships

    @classmethod
    async def analyze_property_spatial(
        cls,
        db: AsyncSession,
        property_id: uuid.UUID,
    ) -> PropertySpatialAnalysisResponse:
        """
        Executes comprehensive, database-backed PostGIS spatial intelligence analysis
        on a property, evaluating all configured spatial rules and persisting findings.
        """
        # Fetch parcel with buildings
        stmt = (
            select(Parcel)
            .options(
                selectinload(Parcel.buildings),
            )
            .where(Parcel.id == property_id)
        )
        parcel = (await db.execute(stmt)).scalar_one_or_none()
        if not parcel:
            return PropertySpatialAnalysisResponse(
                property_id=property_id,
                ulpin_2d="UNKNOWN",
                analysis_timestamp=datetime.utcnow(),
                analysis_status="UNAVAILABLE",
                relationships=[],
                findings=[],
                nearby_infrastructure_count=0,
            )

        prc_geom = cls._to_shapely(parcel.geom_2d)
        if not prc_geom:
            return PropertySpatialAnalysisResponse(
                property_id=property_id,
                ulpin_2d=parcel.ulpin_2d,
                analysis_timestamp=datetime.utcnow(),
                analysis_status="UNAVAILABLE",
                relationships=[],
                findings=[],
                nearby_infrastructure_count=0,
            )

        # 1. Fetch Phase 8 evidence for confidence linking
        ev_stmt = select(Evidence).where(Evidence.entity_id == parcel.id)
        parcel_ev = (await db.execute(ev_stmt)).scalars().first()
        parcel_confidence = float(parcel_ev.confidence_score) if parcel_ev else 0.850

        # Fetch existing findings for deduplication
        existing_conflicts_stmt = select(Conflict).where(
            or_(
                Conflict.parcel_id == parcel.id,
                Conflict.entity_id == parcel.id,
            )
        )
        existing_conflicts = (await db.execute(existing_conflicts_stmt)).scalars().all()
        conflict_map = {
            (c.rule_id, c.entity_type, c.entity_id, c.related_entity_type, c.related_entity_id): c
            for c in existing_conflicts
        }

        generated_findings: List[Conflict] = []

        # ---------------------------------------------------------------------
        # RULE-GEOM-001: Geometry Validity Check
        # ---------------------------------------------------------------------
        is_valid, reason, _ = SpatialRuleEngine.validate_geometry(prc_geom)
        if not is_valid:
            key = ("RULE-GEOM-001", "PARCEL", parcel.id, None, None)
            explanation = f"Parcel {parcel.ulpin_2d} boundary geometry is invalid: {reason}."
            if key in conflict_map:
                c = conflict_map[key]
                c.explanation = explanation
                c.updated_at = datetime.utcnow()
                generated_findings.append(c)
            else:
                c = Conflict(
                    conflict_type=ConflictType.GEOMETRY_INVALID.value,
                    severity=ConflictSeverity.HIGH.value,
                    rule_id="RULE-GEOM-001",
                    rule_name="Geometry Structural Validity",
                    entity_type="PARCEL",
                    entity_id=parcel.id,
                    parcel_id=parcel.id,
                    measured_value=Decimal("0.0"),
                    threshold_value=Decimal("0.0"),
                    measured_unit="validity",
                    explanation=explanation,
                    discrepancy_details={"reason": reason},
                    confidence_score=Decimal(str(parcel_confidence)),
                    status=ConflictStatus.OPEN.value,
                )
                db.add(c)
                generated_findings.append(c)

        # ---------------------------------------------------------------------
        # RULE-BLDG-001 & RULE-BLDG-002: Building ↔ Parcel Evaluations
        # ---------------------------------------------------------------------
        for bld in parcel.buildings:
            bld_geom = cls._to_shapely(bld.footprint_geom)
            if not bld_geom:
                continue

            # Fetch building evidence
            bld_ev_stmt = select(Evidence).where(Evidence.entity_id == bld.id)
            bld_ev = (await db.execute(bld_ev_stmt)).scalars().first()
            bld_confidence = float(bld_ev.confidence_score) if bld_ev else float(bld.confidence_score or 0.85)

            # Conservative conflict confidence: min(C_parcel, C_building)
            finding_conf = round(min(parcel_confidence, bld_confidence), 3)

            evidence_ref = {
                "parcel_source": parcel_ev.source_type if parcel_ev else "CADASTRAL_DATA",
                "parcel_dataset": parcel_ev.dataset.name if parcel_ev and parcel_ev.dataset else "Authoritative Revenue Cadastre",
                "building_source": bld_ev.source_type if bld_ev else "DRONE_IMAGERY",
                "building_extraction": getattr(bld, "extraction_method", "YOLOv8x Building Segmentation"),
                "height_source": getattr(bld, "height_source", "LIDAR_POINT_CLOUD"),
            }

            # Check Rule 1: Outside Parcel
            res_outside = SpatialRuleEngine.evaluate_building_outside(
                bld_geom=bld_geom,
                prc_geom=prc_geom,
                building_code=bld.building_code,
                parcel_ulpin=parcel.ulpin_2d,
                threshold_sqm=0.500,
            )

            if res_outside:
                key = ("RULE-BLDG-001", "BUILDING", bld.id, "PARCEL", parcel.id)
                diff_wkb = from_shape(res_outside["conflict_geom"], srid=4326)

                if key in conflict_map:
                    c = conflict_map[key]
                    c.measured_value = Decimal(str(res_outside["measured_value"]))
                    c.deviation_value = Decimal(str(res_outside["deviation_value"]))
                    c.severity = res_outside["severity"]
                    c.explanation = res_outside["explanation"]
                    c.conflict_geom = diff_wkb
                    c.evidence_reference = evidence_ref
                    c.confidence_score = Decimal(str(finding_conf))
                    c.updated_at = datetime.utcnow()
                    generated_findings.append(c)
                else:
                    c = Conflict(
                        conflict_type=res_outside["conflict_type"],
                        severity=res_outside["severity"],
                        rule_id=res_outside["rule_id"],
                        rule_name=res_outside["rule_name"],
                        entity_type="BUILDING",
                        entity_id=bld.id,
                        related_entity_type="PARCEL",
                        related_entity_id=parcel.id,
                        parcel_id=parcel.id,
                        building_id=bld.id,
                        measured_value=Decimal(str(res_outside["measured_value"])),
                        threshold_value=Decimal(str(res_outside["threshold_value"])),
                        measured_unit="m²",
                        deviation_value=Decimal(str(res_outside["deviation_value"])),
                        explanation=res_outside["explanation"],
                        discrepancy_details=res_outside["discrepancy_details"],
                        evidence_reference=evidence_ref,
                        confidence_score=Decimal(str(finding_conf)),
                        conflict_geom=diff_wkb,
                        status=ConflictStatus.OPEN.value,
                    )
                    db.add(c)
                    generated_findings.append(c)

            # Check Rule 2: Boundary Proximity / Setback
            res_prox = SpatialRuleEngine.evaluate_building_proximity(
                bld_geom=bld_geom,
                prc_geom=prc_geom,
                building_code=bld.building_code,
                parcel_ulpin=parcel.ulpin_2d,
                threshold_meters=1.000,
            )

            if res_prox:
                key = ("RULE-BLDG-002", "BUILDING", bld.id, "PARCEL", parcel.id)
                bld_wkb = from_shape(res_prox["conflict_geom"], srid=4326)

                if key in conflict_map:
                    c = conflict_map[key]
                    c.measured_value = Decimal(str(res_prox["measured_value"]))
                    c.deviation_value = Decimal(str(res_prox["deviation_value"]))
                    c.severity = res_prox["severity"]
                    c.explanation = res_prox["explanation"]
                    c.evidence_reference = evidence_ref
                    c.confidence_score = Decimal(str(finding_conf))
                    c.updated_at = datetime.utcnow()
                    generated_findings.append(c)
                else:
                    c = Conflict(
                        conflict_type=res_prox["conflict_type"],
                        severity=res_prox["severity"],
                        rule_id=res_prox["rule_id"],
                        rule_name=res_prox["rule_name"],
                        entity_type="BUILDING",
                        entity_id=bld.id,
                        related_entity_type="PARCEL",
                        related_entity_id=parcel.id,
                        parcel_id=parcel.id,
                        building_id=bld.id,
                        measured_value=Decimal(str(res_prox["measured_value"])),
                        threshold_value=Decimal(str(res_prox["threshold_value"])),
                        measured_unit="m",
                        deviation_value=Decimal(str(res_prox["deviation_value"])),
                        explanation=res_prox["explanation"],
                        discrepancy_details=res_prox["discrepancy_details"],
                        evidence_reference=evidence_ref,
                        confidence_score=Decimal(str(finding_conf)),
                        conflict_geom=bld_wkb,
                        status=ConflictStatus.REVIEW_REQUIRED.value,
                    )
                    db.add(c)
                    generated_findings.append(c)

        # ---------------------------------------------------------------------
        # RULE-PRCL-001: Parcel Overlap Evaluation
        # ---------------------------------------------------------------------
        adj_stmt = select(Parcel).where(and_(Parcel.city_id == parcel.city_id, Parcel.id != parcel.id))
        adj_parcels = (await db.execute(adj_stmt)).scalars().all()

        for other_p in adj_parcels:
            other_geom = cls._to_shapely(other_p.geom_2d)
            if not other_geom:
                continue

            res_overlap = SpatialRuleEngine.evaluate_parcel_overlap(
                prc1_geom=prc_geom,
                prc2_geom=other_geom,
                ulpin1=parcel.ulpin_2d,
                ulpin2=other_p.ulpin_2d,
                threshold_sqm=1.000,
            )

            if res_overlap:
                key = ("RULE-PRCL-001", "PARCEL", parcel.id, "PARCEL", other_p.id)
                overlap_wkb = from_shape(res_overlap["conflict_geom"], srid=4326)

                if key in conflict_map:
                    c = conflict_map[key]
                    c.measured_value = Decimal(str(res_overlap["measured_value"]))
                    c.deviation_value = Decimal(str(res_overlap["deviation_value"]))
                    c.explanation = res_overlap["explanation"]
                    c.conflict_geom = overlap_wkb
                    c.updated_at = datetime.utcnow()
                    generated_findings.append(c)
                else:
                    c = Conflict(
                        conflict_type=res_overlap["conflict_type"],
                        severity=res_overlap["severity"],
                        rule_id=res_overlap["rule_id"],
                        rule_name=res_overlap["rule_name"],
                        entity_type="PARCEL",
                        entity_id=parcel.id,
                        related_entity_type="PARCEL",
                        related_entity_id=other_p.id,
                        parcel_id=parcel.id,
                        measured_value=Decimal(str(res_overlap["measured_value"])),
                        threshold_value=Decimal(str(res_overlap["threshold_value"])),
                        measured_unit="m²",
                        deviation_value=Decimal(str(res_overlap["deviation_value"])),
                        explanation=res_overlap["explanation"],
                        discrepancy_details=res_overlap["discrepancy_details"],
                        evidence_reference={"parcel_a": parcel.ulpin_2d, "parcel_b": other_p.ulpin_2d},
                        confidence_score=Decimal(str(parcel_confidence)),
                        conflict_geom=overlap_wkb,
                        status=ConflictStatus.OPEN.value,
                    )
                    db.add(c)
                    generated_findings.append(c)

        # ---------------------------------------------------------------------
        # RULE-INFR-001: Infrastructure Proximity Evaluation
        # ---------------------------------------------------------------------
        infra_stmt = select(Infrastructure).where(Infrastructure.city_id == parcel.city_id)
        infras = (await db.execute(infra_stmt)).scalars().all()

        for inf in infras:
            inf_geom = cls._to_shapely(inf.geom_spatial)
            if not inf_geom:
                continue

            res_inf = SpatialRuleEngine.evaluate_infrastructure_proximity(
                prc_geom=prc_geom,
                infra_geom=inf_geom,
                parcel_ulpin=parcel.ulpin_2d,
                infra_name=inf.name,
                utility_category=inf.utility_category,
                threshold_meters=5.000,
            )

            if res_inf:
                key = ("RULE-INFR-001", "PARCEL", parcel.id, "INFRASTRUCTURE", inf.id)
                inf_wkb = from_shape(res_inf["conflict_geom"], srid=4326)

                if key in conflict_map:
                    c = conflict_map[key]
                    c.measured_value = Decimal(str(res_inf["measured_value"]))
                    c.explanation = res_inf["explanation"]
                    c.conflict_geom = inf_wkb
                    c.updated_at = datetime.utcnow()
                    generated_findings.append(c)
                else:
                    c = Conflict(
                        conflict_type=res_inf["conflict_type"],
                        severity=res_inf["severity"],
                        rule_id=res_inf["rule_id"],
                        rule_name=res_inf["rule_name"],
                        entity_type="PARCEL",
                        entity_id=parcel.id,
                        related_entity_type="INFRASTRUCTURE",
                        related_entity_id=inf.id,
                        parcel_id=parcel.id,
                        measured_value=Decimal(str(res_inf["measured_value"])),
                        threshold_value=Decimal(str(res_inf["threshold_value"])),
                        measured_unit="m",
                        deviation_value=Decimal(str(res_inf["deviation_value"])),
                        explanation=res_inf["explanation"],
                        discrepancy_details=res_inf["discrepancy_details"],
                        evidence_reference={"infrastructure_name": inf.name, "category": inf.utility_category},
                        confidence_score=Decimal(str(parcel_confidence)),
                        conflict_geom=inf_wkb,
                        status=ConflictStatus.REVIEW_REQUIRED.value,
                    )
                    db.add(c)
                    generated_findings.append(c)

        # Commit durable findings to Supabase
        await db.commit()

        # Reload relationships and formatted items
        relationships = await cls.get_property_spatial_relationships(db, property_id)
        formatted_findings = [cls._format_conflict_item(f, parcel=parcel) for f in generated_findings]

        return PropertySpatialAnalysisResponse(
            property_id=parcel.id,
            ulpin_2d=parcel.ulpin_2d,
            analysis_timestamp=datetime.utcnow(),
            analysis_status="COMPLETED",
            relationships=relationships,
            findings=formatted_findings,
            nearby_infrastructure_count=len([r for r in relationships if r.related_entity_type == "INFRASTRUCTURE"]),
        )
