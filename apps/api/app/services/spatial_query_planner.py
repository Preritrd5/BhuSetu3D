"""
BhuSetu 3D Spatial Query Planner & Tool Registry
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import uuid
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload

from app.models.parcel import Parcel
from app.models.building import Building
from app.models.infrastructure import Infrastructure, ParcelInfrastructure
from app.models.provenance import Conflict, Evidence, ProvenanceRecord
from app.models.temporal import PropertyStateVersion, ChangeEvent
from app.schemas.spatial_investigator import (
    SpatialIntent,
    SpatialIntentType,
    InvestigationResultItem,
    MapActionType,
    MapActionDirective,
)
from app.services.spatial_service import SpatialService
from app.services.evidence_service import EvidenceService
from app.core.spatial import geometry_to_geojson
from app.core.logging import logger


class SpatialToolRegistry:
    """
    Catalog of approved read-only spatial tools.
    Every tool executes strictly validated PostGIS/Supabase queries.
    """

    @classmethod
    async def find_boundary_discrepancies(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Find buildings extending outside their parcels or setback discrepancies."""
        query = select(Conflict).options(
            selectinload(Conflict.parcel),
            selectinload(Conflict.building)
        ).where(
            Conflict.status.in_(["OPEN", "REVIEWED"])
        )

        # Filter by rule or conflict type
        if intent.conflict_type:
            query = query.where(
                or_(
                    Conflict.conflict_type == intent.conflict_type,
                    Conflict.conflict_type == "PARCEL_BOUNDARY_OVERLAP" if intent.conflict_type == "BUILDING_OUTSIDE_PARCEL" else False
                )
            )
        else:
            query = query.where(
                Conflict.rule_id.in_(["RULE-BLDG-001", "RULE-BLDG-002", "RULE-SETBACK-01", "RULE-HEIGHT-01"]) |
                Conflict.conflict_type.in_(["BUILDING_OUTSIDE_PARCEL", "SETBACK_VIOLATION", "PARCEL_BOUNDARY_OVERLAP", "VERTICAL_HEIGHT_EXCEEDED"])
            )

        if intent.severity:
            query = query.where(Conflict.severity == intent.severity)

        if intent.min_confidence is not None:
            query = query.where(Conflict.confidence_score >= intent.min_confidence)

        if intent.property_id:
            try:
                p_uuid = uuid.UUID(intent.property_id)
                query = query.where(Conflict.parcel_id == p_uuid)
            except Exception:
                pass

        query = query.order_by(desc(Conflict.measured_value), desc(Conflict.created_at)).limit(intent.limit)
        res = await session.execute(query)
        conflicts = res.scalars().all()

        results: List[InvestigationResultItem] = []
        for c in conflicts:
            p_ulpin = c.parcel.ulpin_2d if c.parcel else "Unknown Parcel"
            b_code = c.building.building_code if c.building else (f"Building {str(c.building_id)[:8]}" if c.building_id else "Building")
            
            # Fetch evidence count for building / parcel
            ev_count = 0
            ev_summary = None
            if c.building_id:
                ev_res = await session.execute(
                    select(func.count(Evidence.id)).where(Evidence.entity_id == c.building_id)
                )
                ev_count = ev_res.scalar() or 0
                if ev_count > 0:
                    ev_summary = f"{ev_count} verified sensor capture(s) attached"

            results.append(
                InvestigationResultItem(
                    entity_id=str(c.building_id or c.parcel_id or c.id),
                    entity_type="BUILDING" if c.building_id else "PARCEL",
                    entity_code=b_code if c.building_id else p_ulpin,
                    title=f"{b_code} on {p_ulpin}",
                    subtitle=c.explanation or c.rule_name,
                    finding_type=c.conflict_type,
                    measured_value=float(c.measured_value) if c.measured_value is not None else None,
                    measured_unit=c.measured_unit or "m²",
                    deviation_value=float(c.deviation_value) if c.deviation_value is not None else None,
                    confidence_score=float(c.confidence_score) if c.confidence_score is not None else 0.85,
                    evidence_count=ev_count,
                    evidence_summary=ev_summary,
                    has_discrepancy=True,
                    geom_geojson=geometry_to_geojson(c.conflict_geom),
                    metadata={
                        "conflict_id": str(c.id),
                        "rule_id": c.rule_id,
                        "severity": c.severity,
                        "status": c.status,
                        "parcel_id": str(c.parcel_id) if c.parcel_id else None,
                        "building_id": str(c.building_id) if c.building_id else None,
                    }
                )
            )

        return results

    @classmethod
    async def find_parcel_overlaps(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Find overlapping parcel cadastral boundaries."""
        query = select(Conflict).options(
            selectinload(Conflict.parcel)
        ).where(
            Conflict.status.in_(["OPEN", "REVIEWED"]),
            Conflict.rule_id == "RULE-PRCL-001"
        )

        if intent.severity:
            query = query.where(Conflict.severity == intent.severity)

        if intent.min_confidence is not None:
            query = query.where(Conflict.confidence_score >= intent.min_confidence)

        query = query.order_by(desc(Conflict.measured_value)).limit(intent.limit)
        res = await session.execute(query)
        conflicts = res.scalars().all()

        results: List[InvestigationResultItem] = []
        for c in conflicts:
            p_ulpin = c.parcel.ulpin_2d if c.parcel else f"Parcel {str(c.parcel_id)[:8]}"
            rel_label = c.related_entity_type or "Adjoining Parcel"

            results.append(
                InvestigationResultItem(
                    entity_id=str(c.parcel_id or c.id),
                    entity_type="PARCEL",
                    entity_code=p_ulpin,
                    title=f"Boundary Overlap: {p_ulpin}",
                    subtitle=c.explanation or f"Overlaps with {rel_label}",
                    finding_type="PARCEL_OVERLAP",
                    measured_value=float(c.measured_value) if c.measured_value is not None else None,
                    measured_unit=c.measured_unit or "m²",
                    deviation_value=float(c.deviation_value) if c.deviation_value is not None else None,
                    confidence_score=float(c.confidence_score) if c.confidence_score is not None else 0.90,
                    has_discrepancy=True,
                    geom_geojson=geometry_to_geojson(c.conflict_geom),
                    metadata={
                        "conflict_id": str(c.id),
                        "rule_id": c.rule_id,
                        "severity": c.severity,
                        "status": c.status,
                        "related_entity_id": str(c.related_entity_id) if c.related_entity_id else None,
                    }
                )
            )

        return results

    @classmethod
    async def find_nearby_infrastructure(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Search for properties within distance of infrastructure corridors."""
        radius = intent.distance_meters or 20.0
        infra_type_filter = intent.infrastructure_type.value if intent.infrastructure_type else None

        results: List[InvestigationResultItem] = []

        # Case A: Specific property context supplied
        if intent.property_id:
            try:
                p_uuid = uuid.UUID(intent.property_id)
                nearby_resp = await SpatialService.get_nearby_infrastructure(session, p_uuid, radius)
                p_obj = await session.get(Parcel, p_uuid)
                p_ulpin = p_obj.ulpin_2d if p_obj else str(intent.property_id)[:8]

                for feat in nearby_resp.features:
                    if infra_type_filter and infra_type_filter != "GENERAL" and feat.type != infra_type_filter:
                        continue

                    results.append(
                        InvestigationResultItem(
                            entity_id=str(feat.id),
                            entity_type="INFRASTRUCTURE",
                            entity_code=feat.name,
                            title=f"{feat.name} near {p_ulpin}",
                            subtitle=f"{feat.type} corridor located {feat.distance_meters:.1f}m away (Buffer: {feat.buffer_zone_meters}m)",
                            finding_type="INFRASTRUCTURE_PROXIMITY",
                            measured_value=feat.distance_meters,
                            measured_unit="m",
                            confidence_score=0.95,
                            has_discrepancy=feat.clearance_warning,
                            metadata={
                                "infrastructure_type": feat.type,
                                "buffer_zone_meters": feat.buffer_zone_meters,
                                "is_inside_buffer": feat.is_inside_buffer,
                                "parcel_id": str(intent.property_id)
                            }
                        )
                    )
                return results
            except Exception as e:
                logger.error(f"Error checking nearby infrastructure for property: {e}")

        # Case B: General query across parcels
        # Fetch parcels and infrastructure, computing metric distance
        parcels_query = select(Parcel).limit(intent.limit)
        p_res = await session.execute(parcels_query)
        parcels = p_res.scalars().all()

        for p in parcels:
            nearby_resp = await SpatialService.get_nearby_infrastructure(session, p.id, radius)
            for feat in nearby_resp.features:
                if infra_type_filter and infra_type_filter != "GENERAL" and feat.type != infra_type_filter:
                    continue

                results.append(
                    InvestigationResultItem(
                        entity_id=str(p.id),
                        entity_type="PARCEL",
                        entity_code=p.ulpin_2d,
                        title=f"{p.ulpin_2d} near {feat.name}",
                        subtitle=f"Within {feat.distance_meters:.1f}m of {feat.name} ({feat.type})",
                        finding_type="INFRASTRUCTURE_PROXIMITY",
                        measured_value=feat.distance_meters,
                        measured_unit="m",
                        confidence_score=0.92,
                        has_discrepancy=feat.clearance_warning,
                        geom_geojson=geometry_to_geojson(p.geom_2d),
                        metadata={
                            "infrastructure_name": feat.name,
                            "infrastructure_type": feat.type,
                            "clearance_warning": feat.clearance_warning,
                            "buffer_zone_meters": feat.buffer_zone_meters
                        }
                    )
                )

        return results[:intent.limit]

    @classmethod
    async def explain_property_findings(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Retrieve all conflicts and evidence factors for a specific property."""
        results: List[InvestigationResultItem] = []
        target_parcel_id = intent.property_id or intent.parcel_id

        if not target_parcel_id:
            # If no target specified, fetch top flagged property
            c_res = await session.execute(
                select(Conflict).where(Conflict.status.in_(["OPEN", "REVIEWED"])).limit(1)
            )
            top_c = c_res.scalar_one_or_none()
            if top_c and top_c.parcel_id:
                target_parcel_id = str(top_c.parcel_id)

        if target_parcel_id:
            try:
                p_uuid = uuid.UUID(target_parcel_id)
                p_obj = await session.get(Parcel, p_uuid)
                p_ulpin = p_obj.ulpin_2d if p_obj else f"Parcel {target_parcel_id[:8]}"

                # 1. Fetch conflicts
                conf_items = await SpatialService.get_property_conflicts(session, p_uuid)
                conf_list = conf_items if isinstance(conf_items, list) else getattr(conf_items, "items", [])
                for c in conf_list:
                    results.append(
                        InvestigationResultItem(
                            entity_id=str(c.id),
                            entity_type="CONFLICT",
                            entity_code=c.rule_id or "RULE-SPATIAL",
                            title=f"{c.rule_name} on {p_ulpin}",
                            subtitle=c.explanation,
                            finding_type=c.conflict_type,
                            measured_value=float(c.measured_value) if c.measured_value is not None else None,
                            measured_unit=c.measured_unit,
                            deviation_value=float(c.deviation_value) if c.deviation_value is not None else None,
                            confidence_score=float(c.confidence_score),
                            has_discrepancy=True,
                            metadata={
                                "rule_id": c.rule_id,
                                "severity": c.severity,
                                "parcel_id": str(p_uuid)
                            }
                        )
                    )

                # 2. Fetch evidence breakdown
                ev_data = await EvidenceService.get_property_evidence(session, p_uuid)
                for ev in ev_data.evidence_items[:3]:
                    results.append(
                        InvestigationResultItem(
                            entity_id=str(ev.id),
                            entity_type="EVIDENCE",
                            entity_code=ev.source_classification,
                            title=f"Evidence: {ev.dataset_name or ev.source_name or 'Cadastral Map'}",
                            subtitle=f"Classification: {ev.source_classification} | Confidence: {int(ev.confidence_score * 100)}%",
                            finding_type="EVIDENCE_RECORD",
                            confidence_score=float(ev.confidence_score),
                            has_discrepancy=False,
                            metadata={
                                "processing_method": ev.processing_method,
                                "source_type": ev.source_type
                            }
                        )
                    )
            except Exception as e:
                logger.error(f"Error explaining property findings: {e}")

        return results

    @classmethod
    async def get_evidence_or_provenance(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Retrieve supporting evidence sources and derivation lineage."""
        results: List[InvestigationResultItem] = []
        target_id = intent.property_id or intent.parcel_id or intent.building_id

        if target_id:
            try:
                t_uuid = uuid.UUID(target_id)
                entity_type = "BUILDING" if intent.building_id else "PARCEL"
                prov_chain = await EvidenceService.get_provenance_chain(session, entity_type, t_uuid)

                for node in prov_chain.nodes:
                    results.append(
                        InvestigationResultItem(
                            entity_id=str(node.id),
                            entity_type="PROVENANCE_STEP",
                            entity_code=node.operation_type,
                            title=f"Lineage: {node.operation_name}",
                            subtitle=f"Method: {node.method} (v{node.algorithm_version or '1.0'})",
                            finding_type="LINEAGE_STEP",
                            confidence_score=float(node.confidence_factor),
                            has_discrepancy=False,
                            metadata={
                                "execution_timestamp": node.execution_timestamp.isoformat() if node.execution_timestamp else None,
                                "parameters": node.parameters
                            }
                        )
                    )
            except Exception as e:
                logger.error(f"Error fetching provenance: {e}")

        return results

    @classmethod
    async def find_temporal_history_and_changes(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Retrieve discrete temporal states and recorded ChangeEvents for property history."""
        results: List[InvestigationResultItem] = []

        # Find target entity UUID if passed
        target_uuid = None
        if intent.property_id:
            try:
                target_uuid = uuid.UUID(intent.property_id)
            except Exception:
                pass
        elif intent.building_id:
            try:
                target_uuid = uuid.UUID(intent.building_id)
            except Exception:
                pass
        elif intent.parcel_id:
            try:
                target_uuid = uuid.UUID(intent.parcel_id)
            except Exception:
                pass

        # 1. Query ChangeEvents
        c_query = select(ChangeEvent).order_by(desc(ChangeEvent.observed_at)).limit(intent.limit)
        if target_uuid:
            c_query = c_query.where(ChangeEvent.entity_id == target_uuid)
        if intent.entity_type:
            c_query = c_query.where(ChangeEvent.entity_type == intent.entity_type.value)

        c_res = await session.execute(c_query)
        events = c_res.scalars().all()

        for ev in events:
            results.append(
                InvestigationResultItem(
                    entity_id=str(ev.id),
                    entity_type="CHANGE_EVENT",
                    entity_code=ev.change_type,
                    title=f"Observed Change: {ev.change_type.replace('_', ' ')}",
                    subtitle=ev.description,
                    finding_type=ev.change_type,
                    confidence_score=float(ev.confidence_score),
                    evidence_count=1 if ev.evidence_reference else 0,
                    has_discrepancy=ev.verification_status != "REJECTED",
                    metadata={
                        "target_entity_type": ev.entity_type,
                        "target_entity_id": str(ev.entity_id),
                        "observed_at": ev.observed_at.isoformat(),
                        "measured_change": ev.measured_change,
                        "verification_status": ev.verification_status,
                    }
                )
            )

        # 2. If target UUID provided, also fetch PropertyStateVersion records
        if target_uuid:
            v_query = (
                select(PropertyStateVersion)
                .where(PropertyStateVersion.entity_id == target_uuid)
                .order_by(asc(PropertyStateVersion.version_number))
            )
            v_res = await session.execute(v_query)
            versions = v_res.scalars().all()
            for ver in versions:
                results.append(
                    InvestigationResultItem(
                        entity_id=str(ver.id),
                        entity_type="PROPERTY_STATE_VERSION",
                        entity_code=f"v{ver.version_number}",
                        title=f"Observation Epoch: {ver.observed_at.isoformat()} (Version {ver.version_number})",
                        subtitle=f"Source: {ver.source_name or 'Aerial/Cadastral Survey'} | Interval: {ver.observed_interval}",
                        finding_type="STATE_SNAPSHOT",
                        confidence_score=float(ver.confidence_score),
                        evidence_count=1 if ver.evidence_reference else 0,
                        has_discrepancy=False,
                        metadata={
                            "version_number": ver.version_number,
                            "observed_at": ver.observed_at.isoformat(),
                            "attributes": ver.attributes_snapshot,
                            "verification_status": ver.verification_status,
                        }
                    )
                )

        return results

    @classmethod
    async def evaluate_or_explain_quality(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> List[InvestigationResultItem]:
        """Tool: Evaluate or retrieve data quality score and component breakdown for an entity."""
        from uuid import UUID
        from app.services.quality_engine import QualityEngine

        target_id_str = intent.property_id or intent.parcel_id or intent.building_id
        if not target_id_str:
            p_res = await session.execute(select(Parcel).limit(1))
            first_p = p_res.scalars().first()
            if first_p:
                target_id_str = str(first_p.id)
                target_type = "PARCEL"
            else:
                return []
        else:
            target_type = "BUILDING" if intent.building_id else "PARCEL"

        try:
            target_uuid = UUID(target_id_str)
        except Exception:
            return []

        if target_type == "PARCEL":
            q_res = await QualityEngine.evaluate_parcel_quality(session, target_uuid, persist_snapshot=False)
        else:
            q_res = await QualityEngine.evaluate_building_quality(session, target_uuid, persist_snapshot=False)

        comps = q_res.component_scores
        desc = (
            f"Overall Data Quality Score: {q_res.overall_score}/100 ({q_res.quality_label}). "
            f"Completeness: {comps.completeness}%, Spatial Validity: {comps.spatial_validity}%, "
            f"Evidence: {comps.evidence_coverage}%, Provenance: {comps.provenance_coverage}%, "
            f"Verification: {comps.verification_coverage}%. "
            f"{len(q_res.active_issues)} active issue(s) identified."
        )

        return [
            InvestigationResultItem(
                entity_id=str(q_res.entity_id),
                entity_type=q_res.entity_type,
                entity_code=q_res.entity_identifier,
                title=f"Data Quality Assessment: {q_res.entity_identifier or str(q_res.entity_id)[:8]}",
                subtitle=f"Score: {q_res.overall_score}/100 — {q_res.quality_label}",
                finding_type="QUALITY_SCORE",
                confidence_score=round(q_res.overall_score / 100.0, 3),
                evidence_count=q_res.evidence_count,
                has_discrepancy=len(q_res.active_issues) > 0,
                explanation=desc,
                metadata={
                    "overall_score": q_res.overall_score,
                    "component_scores": comps.model_dump(),
                    "missing_fields": q_res.missing_fields,
                    "active_issues_count": len(q_res.active_issues),
                    "is_verified": q_res.is_verified,
                    "scoring_version": q_res.scoring_version,
                }
            )
        ]


class SpatialQueryPlanner:
    """
    Deterministic Query Planner.
    Maps validated natural-language SpatialIntent to approved backend spatial tools.
    """

    @classmethod
    async def plan_and_execute(
        cls,
        session: AsyncSession,
        intent: SpatialIntent
    ) -> Tuple[str, List[InvestigationResultItem]]:
        """
        Executes the planned tool deterministically.
        Returns: (tool_name, results_list)
        """
        intent_type = intent.intent

        # 1. Boundary discrepancies & Setbacks
        if intent_type == SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY:
            tool_name = "find_boundary_discrepancies"
            items = await SpatialToolRegistry.find_boundary_discrepancies(session, intent)
            return tool_name, items

        # 2. Parcel overlaps
        if intent_type == SpatialIntentType.OVERLAP_QUERY:
            tool_name = "find_parcel_overlaps"
            items = await SpatialToolRegistry.find_parcel_overlaps(session, intent)
            return tool_name, items

        # 3. Infrastructure proximity & corridors
        if intent_type in (SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY, SpatialIntentType.PROXIMITY_SEARCH):
            tool_name = "find_nearby_infrastructure"
            items = await SpatialToolRegistry.find_nearby_infrastructure(session, intent)
            return tool_name, items

        # 4. Temporal history, Change queries & Infrastructure history (Phase 12)
        if intent_type in (
            SpatialIntentType.PROPERTY_HISTORY,
            SpatialIntentType.CHANGE_QUERY,
            SpatialIntentType.TEMPORAL_COMPARISON,
            SpatialIntentType.INFRASTRUCTURE_HISTORY,
            SpatialIntentType.FIRST_OBSERVED_QUERY,
            SpatialIntentType.TEMPORAL_RELATIONSHIP_QUERY,
        ):
            tool_name = "find_temporal_history_and_changes"
            items = await SpatialToolRegistry.find_temporal_history_and_changes(session, intent)
            return tool_name, items

        # 5. Explanations (Why was this flagged?)
        if intent_type in (SpatialIntentType.CONFLICT_EXPLANATION, SpatialIntentType.PROPERTY_EXPLANATION):
            tool_name = "explain_property_findings"
            items = await SpatialToolRegistry.explain_property_findings(session, intent)
            return tool_name, items

        # 6. Data Quality & Completeness (Phase 13)
        if intent_type in (
            SpatialIntentType.QUALITY_QUERY,
            SpatialIntentType.QUALITY_EXPLANATION,
            SpatialIntentType.DATA_COMPLETENESS_QUERY,
            SpatialIntentType.EVIDENCE_COVERAGE_QUERY,
            SpatialIntentType.VERIFICATION_COVERAGE_QUERY,
        ):
            tool_name = "evaluate_or_explain_quality"
            items = await SpatialToolRegistry.evaluate_or_explain_quality(session, intent)
            return tool_name, items

        # 6. Evidence & Provenance
        if intent_type in (SpatialIntentType.EVIDENCE_QUERY, SpatialIntentType.PROVENANCE_QUERY, SpatialIntentType.CONFIDENCE_QUERY):
            tool_name = "get_evidence_or_provenance"
            items = await SpatialToolRegistry.get_evidence_or_provenance(session, intent)
            return tool_name, items

        # 7. General Conflicts listing
        if intent_type == SpatialIntentType.SPATIAL_CONFLICT_QUERY:
            tool_name = "find_boundary_discrepancies"
            items = await SpatialToolRegistry.find_boundary_discrepancies(session, intent)
            return tool_name, items

        # Fallback default
        tool_name = "find_boundary_discrepancies"
        items = await SpatialToolRegistry.find_boundary_discrepancies(session, intent)
        return tool_name, items
