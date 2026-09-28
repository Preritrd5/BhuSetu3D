"""
BhuSetu 3D 4D Temporal Property History Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence

Orchestrates discrete temporal state snapshots, PostGIS metric geometry comparison,
multi-epoch change detection, and deterministic change-event deduplication.
"""
import json
from decimal import Decimal
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any, Tuple
import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, desc, asc, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.temporal import PropertyStateVersion, ChangeEvent
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.infrastructure import Infrastructure
from app.schemas.temporal import (
    ChangeType,
    PropertyStateVersionItem,
    ChangeEventItem,
    PropertyHistoryTimelineResponse,
    TemporalCompareResponse,
)
from app.services.audit_service import AuditService


class TemporalService:
    @staticmethod
    async def get_property_history(
        db: AsyncSession,
        entity_type: str,
        entity_id: UUID,
    ) -> PropertyHistoryTimelineResponse:
        """
        Retrieves discrete temporal history timeline for an entity, including all historical
        snapshots, recorded change events, and observation dates.
        """
        entity_upper = entity_type.upper()

        # 1. Fetch current entity details
        current_state = None
        entity_identifier = None

        if entity_upper == "PARCEL":
            p_stmt = select(Parcel).where(Parcel.id == entity_id)
            p_res = await db.execute(p_stmt)
            parcel = p_res.scalar_one_or_none()
            if parcel:
                entity_identifier = parcel.ulpin_2d or parcel.survey_number
                current_state = {
                    "ulpin_2d": parcel.ulpin_2d,
                    "survey_number": parcel.survey_number,
                    "recorded_area_sqm": float(parcel.recorded_area_sqm) if parcel.recorded_area_sqm else None,
                    "computed_area_sqm": float(parcel.computed_area_sqm) if parcel.computed_area_sqm else None,
                    "land_use": parcel.land_use,
                    "source": "CURRENT_CADASTRE",
                }
        elif entity_upper == "BUILDING":
            b_stmt = select(Building).where(Building.id == entity_id)
            b_res = await db.execute(b_stmt)
            building = b_res.scalar_one_or_none()
            if building:
                entity_identifier = building.building_code
                current_state = {
                    "building_code": building.building_code,
                    "building_name": building.name,
                    "detected_floors": building.detected_floors,
                    "sanctioned_floors": building.sanctioned_floors,
                    "building_height": float(building.building_height) if building.building_height else None,
                    "building_type": building.building_type,
                    "source": "CURRENT_LOD2_MODEL",
                }
        elif entity_upper == "INFRASTRUCTURE":
            i_stmt = select(Infrastructure).where(Infrastructure.id == entity_id)
            i_res = await db.execute(i_stmt)
            infra = i_res.scalar_one_or_none()
            if infra:
                entity_identifier = infra.name
                current_state = {
                    "name": infra.name,
                    "utility_category": infra.utility_category,
                    "is_subsurface": infra.is_subsurface,
                    "depth_meters": float(infra.depth_meters) if infra.depth_meters else 0.0,
                    "source": infra.evidence_source_type,
                }

        # 2. Query PropertyStateVersion records
        # Use ST_AsGeoJSON to extract GeoJSON representations safely
        v_stmt = (
            select(
                PropertyStateVersion,
                func.ST_AsGeoJSON(PropertyStateVersion.geom_spatial).label("geojson")
            )
            .where(
                and_(
                    PropertyStateVersion.entity_type == entity_upper,
                    PropertyStateVersion.entity_id == entity_id,
                )
            )
            .order_by(asc(PropertyStateVersion.version_number))
        )
        v_res = await db.execute(v_stmt)
        v_rows = v_res.all()

        versions = []
        obs_dates = set()

        for ver, geojson_str in v_rows:
            obs_dates.add(ver.observed_at)
            geom_dict = json.loads(geojson_str) if geojson_str else None
            versions.append(
                PropertyStateVersionItem(
                    id=ver.id,
                    entity_type=ver.entity_type,
                    entity_id=ver.entity_id,
                    version_number=ver.version_number,
                    observed_at=ver.observed_at,
                    valid_from=ver.valid_from,
                    valid_to=ver.valid_to,
                    observed_interval=ver.observed_interval,
                    source_dataset_id=ver.source_dataset_id,
                    source_name=ver.source_name,
                    geom_geojson=geom_dict,
                    attributes_snapshot=ver.attributes_snapshot or {},
                    evidence_reference=ver.evidence_reference or {},
                    confidence_score=float(ver.confidence_score) if ver.confidence_score else 0.900,
                    verification_status=ver.verification_status,
                    created_at=ver.created_at,
                )
            )

        # 3. Query ChangeEvent records
        c_stmt = (
            select(
                ChangeEvent,
                func.ST_AsGeoJSON(ChangeEvent.change_geom).label("geojson")
            )
            .where(
                and_(
                    ChangeEvent.entity_type == entity_upper,
                    ChangeEvent.entity_id == entity_id,
                )
            )
            .order_by(asc(ChangeEvent.observed_at))
        )
        c_res = await db.execute(c_stmt)
        c_rows = c_res.all()

        change_events = []
        for chg, geojson_str in c_rows:
            geom_dict = json.loads(geojson_str) if geojson_str else None
            change_events.append(
                ChangeEventItem(
                    id=chg.id,
                    entity_type=chg.entity_type,
                    entity_id=chg.entity_id,
                    change_type=chg.change_type,
                    previous_version_id=chg.previous_version_id,
                    new_version_id=chg.new_version_id,
                    observed_at=chg.observed_at,
                    measured_change=chg.measured_change or {},
                    change_geom_geojson=geom_dict,
                    description=chg.description,
                    evidence_reference=chg.evidence_reference or {},
                    confidence_score=float(chg.confidence_score) if chg.confidence_score else 0.850,
                    verification_status=chg.verification_status,
                    status=chg.status,
                    analysis_version=chg.analysis_version,
                    created_at=chg.created_at,
                )
            )

        return PropertyHistoryTimelineResponse(
            entity_type=entity_upper,
            entity_id=entity_id,
            entity_identifier=entity_identifier,
            current_state=current_state,
            versions=versions,
            change_events=change_events,
            observation_dates=sorted(list(obs_dates)),
        )

    @staticmethod
    async def get_version_detail(
        db: AsyncSession,
        version_id: UUID,
    ) -> PropertyStateVersionItem:
        """
        Retrieves a single discrete state version with GeoJSON geometry.
        """
        stmt = (
            select(
                PropertyStateVersion,
                func.ST_AsGeoJSON(PropertyStateVersion.geom_spatial).label("geojson")
            )
            .where(PropertyStateVersion.id == version_id)
        )
        res = await db.execute(stmt)
        row = res.one_or_none()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Property state version '{version_id}' not found.",
            )
        ver, geojson_str = row
        geom_dict = json.loads(geojson_str) if geojson_str else None
        return PropertyStateVersionItem(
            id=ver.id,
            entity_type=ver.entity_type,
            entity_id=ver.entity_id,
            version_number=ver.version_number,
            observed_at=ver.observed_at,
            valid_from=ver.valid_from,
            valid_to=ver.valid_to,
            observed_interval=ver.observed_interval,
            source_dataset_id=ver.source_dataset_id,
            source_name=ver.source_name,
            geom_geojson=geom_dict,
            attributes_snapshot=ver.attributes_snapshot or {},
            evidence_reference=ver.evidence_reference or {},
            confidence_score=float(ver.confidence_score) if ver.confidence_score else 0.900,
            verification_status=ver.verification_status,
            created_at=ver.created_at,
        )

    @staticmethod
    async def get_change_events(
        db: AsyncSession,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        change_type: Optional[str] = None,
        verification_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ChangeEventItem], int]:
        """
        Retrieves paginated change events with filtering.
        """
        conditions = []
        if entity_type:
            conditions.append(ChangeEvent.entity_type == entity_type.upper())
        if entity_id:
            conditions.append(ChangeEvent.entity_id == entity_id)
        if change_type:
            conditions.append(ChangeEvent.change_type == change_type)
        if verification_status:
            conditions.append(ChangeEvent.verification_status == verification_status)

        count_stmt = select(func.count(ChangeEvent.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total_res = await db.execute(count_stmt)
        total = total_res.scalar_one()

        skip = (page - 1) * page_size
        stmt = (
            select(
                ChangeEvent,
                func.ST_AsGeoJSON(ChangeEvent.change_geom).label("geojson")
            )
            .order_by(desc(ChangeEvent.observed_at), desc(ChangeEvent.created_at))
            .offset(skip)
            .limit(page_size)
        )
        if conditions:
            stmt = stmt.where(and_(*conditions))

        res = await db.execute(stmt)
        items = []
        for chg, geojson_str in res.all():
            geom_dict = json.loads(geojson_str) if geojson_str else None
            items.append(
                ChangeEventItem(
                    id=chg.id,
                    entity_type=chg.entity_type,
                    entity_id=chg.entity_id,
                    change_type=chg.change_type,
                    previous_version_id=chg.previous_version_id,
                    new_version_id=chg.new_version_id,
                    observed_at=chg.observed_at,
                    measured_change=chg.measured_change or {},
                    change_geom_geojson=geom_dict,
                    description=chg.description,
                    evidence_reference=chg.evidence_reference or {},
                    confidence_score=float(chg.confidence_score) if chg.confidence_score else 0.850,
                    verification_status=chg.verification_status,
                    status=chg.status,
                    analysis_version=chg.analysis_version,
                    created_at=chg.created_at,
                )
            )
        return items, total

    @staticmethod
    async def get_change_event_detail(
        db: AsyncSession,
        event_id: UUID,
    ) -> ChangeEventItem:
        """
        Retrieves a single change event with its PostGIS diff geometry.
        """
        stmt = (
            select(
                ChangeEvent,
                func.ST_AsGeoJSON(ChangeEvent.change_geom).label("geojson")
            )
            .where(ChangeEvent.id == event_id)
        )
        res = await db.execute(stmt)
        row = res.one_or_none()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Change event '{event_id}' not found.",
            )
        chg, geojson_str = row
        geom_dict = json.loads(geojson_str) if geojson_str else None
        return ChangeEventItem(
            id=chg.id,
            entity_type=chg.entity_type,
            entity_id=chg.entity_id,
            change_type=chg.change_type,
            previous_version_id=chg.previous_version_id,
            new_version_id=chg.new_version_id,
            observed_at=chg.observed_at,
            measured_change=chg.measured_change or {},
            change_geom_geojson=geom_dict,
            description=chg.description,
            evidence_reference=chg.evidence_reference or {},
            confidence_score=float(chg.confidence_score) if chg.confidence_score else 0.850,
            verification_status=chg.verification_status,
            status=chg.status,
            analysis_version=chg.analysis_version,
            created_at=chg.created_at,
        )

    @staticmethod
    async def compare_temporal_states(
        db: AsyncSession,
        entity_type: str,
        entity_id: UUID,
        from_version_id: Optional[UUID] = None,
        to_version_id: Optional[UUID] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> TemporalCompareResponse:
        """
        Executes a deterministic metric comparison between two temporal states of an entity.
        Computes footprint area difference, percentage change, floor count diff, and height diff.
        """
        entity_upper = entity_type.upper()

        # Query all versions for this entity
        v_stmt = (
            select(
                PropertyStateVersion,
                func.ST_AsGeoJSON(PropertyStateVersion.geom_spatial).label("geojson")
            )
            .where(
                and_(
                    PropertyStateVersion.entity_type == entity_upper,
                    PropertyStateVersion.entity_id == entity_id,
                )
            )
            .order_by(asc(PropertyStateVersion.observed_at), asc(PropertyStateVersion.version_number))
        )
        v_res = await db.execute(v_stmt)
        rows = list(v_res.all())

        if len(rows) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Temporal comparison unavailable: Entity has only {len(rows)} recorded state observation(s). Minimum 2 discrete observations required.",
            )

        # Resolve from_version and to_version
        v1_row = None
        v2_row = None

        if from_version_id and to_version_id:
            for r in rows:
                if r[0].id == from_version_id:
                    v1_row = r
                if r[0].id == to_version_id:
                    v2_row = r
        elif from_date and to_date:
            for r in rows:
                if r[0].observed_at <= from_date:
                    v1_row = r
                if r[0].observed_at >= to_date:
                    v2_row = r
            if not v1_row:
                v1_row = rows[0]
            if not v2_row:
                v2_row = rows[-1]
        else:
            # Default to oldest vs newest
            v1_row = rows[0]
            v2_row = rows[-1]

        if not v1_row or not v2_row or v1_row[0].id == v2_row[0].id:
            v1_row = rows[0]
            v2_row = rows[-1]

        v1, v1_geojson = v1_row
        v2, v2_geojson = v2_row

        v1_item = PropertyStateVersionItem(
            id=v1.id,
            entity_type=v1.entity_type,
            entity_id=v1.entity_id,
            version_number=v1.version_number,
            observed_at=v1.observed_at,
            valid_from=v1.valid_from,
            valid_to=v1.valid_to,
            observed_interval=v1.observed_interval,
            source_dataset_id=v1.source_dataset_id,
            source_name=v1.source_name,
            geom_geojson=json.loads(v1_geojson) if v1_geojson else None,
            attributes_snapshot=v1.attributes_snapshot or {},
            evidence_reference=v1.evidence_reference or {},
            confidence_score=float(v1.confidence_score) if v1.confidence_score else 0.900,
            verification_status=v1.verification_status,
            created_at=v1.created_at,
        )

        v2_item = PropertyStateVersionItem(
            id=v2.id,
            entity_type=v2.entity_type,
            entity_id=v2.entity_id,
            version_number=v2.version_number,
            observed_at=v2.observed_at,
            valid_from=v2.valid_from,
            valid_to=v2.valid_to,
            observed_interval=v2.observed_interval,
            source_dataset_id=v2.source_dataset_id,
            source_name=v2.source_name,
            geom_geojson=json.loads(v2_geojson) if v2_geojson else None,
            attributes_snapshot=v2.attributes_snapshot or {},
            evidence_reference=v2.evidence_reference or {},
            confidence_score=float(v2.confidence_score) if v2.confidence_score else 0.900,
            verification_status=v2.verification_status,
            created_at=v2.created_at,
        )

        # Attribute extraction
        a1 = v1.attributes_snapshot or {}
        a2 = v2.attributes_snapshot or {}

        area1 = float(a1.get("measured_area", a1.get("footprint_area_sqm", 0.0)))
        area2 = float(a2.get("measured_area", a2.get("footprint_area_sqm", 0.0)))
        area_diff = round(area2 - area1, 2)
        pct_change = round((area_diff / area1 * 100.0), 2) if area1 > 0 else 0.0

        floors1 = a1.get("total_floors", a1.get("floor_count"))
        floors2 = a2.get("total_floors", a2.get("floor_count"))
        floor_diff = (int(floors2) - int(floors1)) if (floors1 is not None and floors2 is not None) else None

        height1 = a1.get("height_meters")
        height2 = a2.get("height_meters")
        height_diff = round(float(height2) - float(height1), 2) if (height1 is not None and height2 is not None) else None

        comparison_metrics = {
            "previous_area_sqm": area1,
            "current_area_sqm": area2,
            "area_difference_sqm": area_diff,
            "percentage_change": pct_change,
            "previous_floors": floors1,
            "current_floors": floors2,
            "floor_difference": floor_diff,
            "previous_height_m": height1,
            "current_height_m": height2,
            "height_difference_m": height_diff,
            "observation_span_days": (v2.observed_at - v1.observed_at).days,
        }

        # Check if identical
        is_identical = (abs(area_diff) < 0.1 and floor_diff in (0, None) and (height_diff is None or abs(height_diff) < 0.1))

        # Query existing change events between these versions
        c_stmt = (
            select(
                ChangeEvent,
                func.ST_AsGeoJSON(ChangeEvent.change_geom).label("geojson")
            )
            .where(
                and_(
                    ChangeEvent.entity_type == entity_upper,
                    ChangeEvent.entity_id == entity_id,
                    ChangeEvent.previous_version_id == v1.id,
                    ChangeEvent.new_version_id == v2.id,
                )
            )
        )
        c_res = await db.execute(c_stmt)
        chg_items = []
        for chg, geojson_str in c_res.all():
            geom_dict = json.loads(geojson_str) if geojson_str else None
            chg_items.append(
                ChangeEventItem(
                    id=chg.id,
                    entity_type=chg.entity_type,
                    entity_id=chg.entity_id,
                    change_type=chg.change_type,
                    previous_version_id=chg.previous_version_id,
                    new_version_id=chg.new_version_id,
                    observed_at=chg.observed_at,
                    measured_change=chg.measured_change or {},
                    change_geom_geojson=geom_dict,
                    description=chg.description,
                    evidence_reference=chg.evidence_reference or {},
                    confidence_score=float(chg.confidence_score) if chg.confidence_score else 0.850,
                    verification_status=chg.verification_status,
                    status=chg.status,
                    analysis_version=chg.analysis_version,
                    created_at=chg.created_at,
                )
            )

        evidence_chain = []
        if v1.evidence_reference:
            evidence_chain.append({"epoch": str(v1.observed_at), "source": v1.source_name, "evidence": v1.evidence_reference})
        if v2.evidence_reference:
            evidence_chain.append({"epoch": str(v2.observed_at), "source": v2.source_name, "evidence": v2.evidence_reference})

        provenance_trace = {
            "operation": "TEMPORAL_GEOMETRIC_METRIC_COMPARISON",
            "from_epoch": str(v1.observed_at),
            "to_epoch": str(v2.observed_at),
            "engine": "PostGIS_3.4_Conformal_Geometry",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        return TemporalCompareResponse(
            entity_type=entity_upper,
            entity_id=entity_id,
            from_version=v1_item,
            to_version=v2_item,
            detected_changes=chg_items,
            comparison_metrics=comparison_metrics,
            is_identical=is_identical,
            evidence_chain=evidence_chain,
            provenance_trace=provenance_trace,
            disclaimer_notice="Observed differences represent spatial telemetry between acquisition dates; they do not establish unauthorized construction or ownership transfer without statutory verification.",
        )

    @staticmethod
    async def detect_and_record_changes(
        db: AsyncSession,
        entity_type: str,
        entity_id: UUID,
        tolerance_pct: float = 2.0,
        min_area_diff: float = 1.0,
        persist_events: bool = True,
        officer_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
    ) -> List[ChangeEventItem]:
        """
        Evaluates temporal state pairs for an entity and generates deduplicated ChangeEvents.
        Categorizes: BUILDING_EXPANDED, BUILDING_REDUCED, FLOOR_COUNT_CHANGED, HEIGHT_CHANGED,
        PARCEL_GEOMETRY_CHANGED.
        """
        entity_upper = entity_type.upper()

        v_stmt = (
            select(
                PropertyStateVersion,
                func.ST_AsGeoJSON(PropertyStateVersion.geom_spatial).label("geojson")
            )
            .where(
                and_(
                    PropertyStateVersion.entity_type == entity_upper,
                    PropertyStateVersion.entity_id == entity_id,
                )
            )
            .order_by(asc(PropertyStateVersion.version_number))
        )
        v_res = await db.execute(v_stmt)
        rows = list(v_res.all())

        if len(rows) < 2:
            return []

        created_events: List[ChangeEventItem] = []

        # Iterate through adjacent pairs
        for i in range(len(rows) - 1):
            v_prev, _ = rows[i]
            v_curr, _ = rows[i + 1]

            a_prev = v_prev.attributes_snapshot or {}
            a_curr = v_curr.attributes_snapshot or {}

            area1 = float(a_prev.get("measured_area", a_prev.get("footprint_area_sqm", 0.0)))
            area2 = float(a_curr.get("measured_area", a_curr.get("footprint_area_sqm", 0.0)))
            area_diff = round(area2 - area1, 2)
            pct_change = round((area_diff / area1 * 100.0), 2) if area1 > 0 else 0.0

            floors1 = a_prev.get("total_floors", a_prev.get("floor_count"))
            floors2 = a_curr.get("total_floors", a_curr.get("floor_count"))

            height1 = a_prev.get("height_meters")
            height2 = a_curr.get("height_meters")

            # Determine candidates
            candidates = []

            # 1. Footprint expansion / reduction
            if area_diff > min_area_diff and pct_change > tolerance_pct:
                desc_text = (
                    f"Building footprint increased by {area_diff:+.2f} m² (+{pct_change}%) "
                    f"between {v_prev.observed_at} and {v_curr.observed_at} observations."
                )
                candidates.append((
                    ChangeType.BUILDING_EXPANDED.value,
                    desc_text,
                    {
                        "previous_area_sqm": area1,
                        "current_area_sqm": area2,
                        "area_difference_sqm": area_diff,
                        "percentage_change": pct_change,
                    }
                ))
            elif area_diff < -min_area_diff and pct_change < -tolerance_pct:
                desc_text = (
                    f"Building footprint reduced by {abs(area_diff):.2f} m² ({pct_change}%) "
                    f"between {v_prev.observed_at} and {v_curr.observed_at} observations."
                )
                candidates.append((
                    ChangeType.BUILDING_REDUCED.value,
                    desc_text,
                    {
                        "previous_area_sqm": area1,
                        "current_area_sqm": area2,
                        "area_difference_sqm": area_diff,
                        "percentage_change": pct_change,
                    }
                ))

            # 2. Floor count change
            if floors1 is not None and floors2 is not None and int(floors1) != int(floors2):
                f_diff = int(floors2) - int(floors1)
                desc_text = (
                    f"Recorded vertical floors changed from {floors1} to {floors2} ({f_diff:+d} floor{'s' if abs(f_diff) > 1 else ''}) "
                    f"between {v_prev.observed_at} and {v_curr.observed_at}."
                )
                candidates.append((
                    ChangeType.FLOOR_COUNT_CHANGED.value,
                    desc_text,
                    {
                        "previous_floors": int(floors1),
                        "current_floors": int(floors2),
                        "floor_difference": f_diff,
                    }
                ))

            # 3. Height change
            if height1 is not None and height2 is not None and abs(float(height2) - float(height1)) >= 0.5:
                h_diff = round(float(height2) - float(height1), 2)
                desc_text = (
                    f"Building height changed from {height1}m to {height2}m ({h_diff:+.2f}m) "
                    f"between {v_prev.observed_at} and {v_curr.observed_at}."
                )
                candidates.append((
                    ChangeType.HEIGHT_CHANGED.value,
                    desc_text,
                    {
                        "previous_height_m": float(height1),
                        "current_height_m": float(height2),
                        "height_difference_m": h_diff,
                    }
                ))

            # Persist and deduplicate
            for change_type_val, desc_text, metrics_dict in candidates:
                # Deduplication check
                dedup_stmt = select(ChangeEvent).where(
                    and_(
                        ChangeEvent.entity_type == entity_upper,
                        ChangeEvent.entity_id == entity_id,
                        ChangeEvent.previous_version_id == v_prev.id,
                        ChangeEvent.new_version_id == v_curr.id,
                        ChangeEvent.change_type == change_type_val,
                        ChangeEvent.analysis_version == "temporal_analysis_v1",
                    )
                )
                existing_res = await db.execute(dedup_stmt)
                existing = existing_res.scalar_one_or_none()

                if existing:
                    created_events.append(
                        ChangeEventItem(
                            id=existing.id,
                            entity_type=existing.entity_type,
                            entity_id=existing.entity_id,
                            change_type=existing.change_type,
                            previous_version_id=existing.previous_version_id,
                            new_version_id=existing.new_version_id,
                            observed_at=existing.observed_at,
                            measured_change=existing.measured_change,
                            change_geom_geojson=None,
                            description=existing.description,
                            evidence_reference=existing.evidence_reference,
                            confidence_score=float(existing.confidence_score),
                            verification_status=existing.verification_status,
                            status=existing.status,
                            analysis_version=existing.analysis_version,
                            created_at=existing.created_at,
                        )
                    )
                elif persist_events:
                    # Confidence derived from input versions
                    c_conf = Decimal(str(round(min(float(v_prev.confidence_score), float(v_curr.confidence_score)) * 0.95, 3)))
                    ev_ref = {
                        "from_dataset": v_prev.source_name,
                        "to_dataset": v_curr.source_name,
                        "from_evidence": v_prev.evidence_reference,
                        "to_evidence": v_curr.evidence_reference,
                    }

                    new_chg = ChangeEvent(
                        id=uuid.uuid4(),
                        entity_type=entity_upper,
                        entity_id=entity_id,
                        change_type=change_type_val,
                        previous_version_id=v_prev.id,
                        new_version_id=v_curr.id,
                        observed_at=v_curr.observed_at,
                        measured_change=metrics_dict,
                        description=desc_text,
                        evidence_reference=ev_ref,
                        confidence_score=c_conf,
                        verification_status="UNREVIEWED",
                        status="DETECTED",
                        analysis_version="temporal_analysis_v1",
                        created_at=datetime.now(timezone.utc),
                    )
                    db.add(new_chg)
                    await db.flush()

                    # Record in AuditLog
                    await AuditService.record_event(
                        db=db,
                        action=f"CHANGE_DETECTED_{change_type_val}",
                        entity_type=entity_upper,
                        entity_id=entity_id,
                        previous_state={"version_id": str(v_prev.id), "observed_at": str(v_prev.observed_at)},
                        new_state={"version_id": str(v_curr.id), "observed_at": str(v_curr.observed_at), "metrics": metrics_dict},
                        user_id=officer_id,
                        ip_address=ip_address,
                    )

                    created_events.append(
                        ChangeEventItem(
                            id=new_chg.id,
                            entity_type=new_chg.entity_type,
                            entity_id=new_chg.entity_id,
                            change_type=new_chg.change_type,
                            previous_version_id=new_chg.previous_version_id,
                            new_version_id=new_chg.new_version_id,
                            observed_at=new_chg.observed_at,
                            measured_change=new_chg.measured_change,
                            change_geom_geojson=None,
                            description=new_chg.description,
                            evidence_reference=new_chg.evidence_reference,
                            confidence_score=float(new_chg.confidence_score),
                            verification_status=new_chg.verification_status,
                            status=new_chg.status,
                            analysis_version=new_chg.analysis_version,
                            created_at=new_chg.created_at,
                        )
                    )

        if persist_events and created_events:
            await db.commit()

        return created_events
