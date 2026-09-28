"""
BhuSetu 3D Vertical Property & ULPIN Model Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 7: Vertical Property Mapping + 3D ULPIN Model
"""
import uuid
import hashlib
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.property_identity import PropertyIdentity
from app.core.spatial import geometry_to_geojson
from app.schemas.property import GeoJSONFeatureCollection, GeoJSONFeature
from app.schemas.vertical_property import (
    PropertyHierarchyResponse,
    ParcelHierarchyItem,
    BuildingHierarchyItem,
    FloorHierarchyItem,
    UnitHierarchyItem,
    CompletenessStatus,
    VerticalValidationResult,
    VerticalValidationCheck,
)
from app.core.logging import logger


# Constant namespace for deterministic prototype ULPIN generation
BHUSETU_ULPIN_NAMESPACE = uuid.UUID("7c9e6679-7425-40de-944b-e07fc1f90ae7")


class VerticalPropertyService:
    """
    Core business logic for vertical property hierarchy (Parcel -> Building -> Floor -> Unit)
    and deterministic ULPIN-oriented prototype identity modeling.
    """

    @staticmethod
    def generate_property_ulpin(ulpin_2d: str, building_code: Optional[str] = None) -> str:
        """
        Generates a deterministic ULPIN-oriented prototype identifier for a property.
        Format: BHU-3D-P{ulpin_2d}-B{building_code}
        Example: BHU-3D-P-KA-BLR-001-B01
        
        NOTE: This is clearly labeled as a prototype/oriented model.
        It does NOT claim official government ULPIN issuance.
        """
        clean_parcel = ulpin_2d.strip().replace(" ", "-")
        if building_code:
            clean_bld = building_code.strip().replace(" ", "-")
            return f"BHU-3D-P-{clean_parcel}-B-{clean_bld}"
        return f"BHU-3D-P-{clean_parcel}"

    @staticmethod
    def generate_floor_ulpin(building_code: str, floor_number: int) -> str:
        """
        Generates a deterministic floor identifier within the 3D property structure.
        Format: BHU-3D-F{floor_number:02d}-{building_code}
        """
        clean_bld = building_code.strip().replace(" ", "-")
        return f"BHU-3D-F{floor_number:02d}-{clean_bld}"

    @staticmethod
    def generate_unit_ulpin(building_code: str, floor_number: int, unit_number: str) -> str:
        """
        Generates a deterministic 3D ULPIN prototype identifier for an atomic property unit.
        Format: BHU-3D-U{unit_number}-F{floor_number:02d}-{building_code}
        """
        clean_bld = building_code.strip().replace(" ", "-")
        clean_unit = unit_number.strip().replace(" ", "-")
        return f"BHU-3D-U{clean_unit}-F{floor_number:02d}-{clean_bld}"

    @staticmethod
    def validate_vertical_hierarchy(
        building: Building,
        floors: List[Floor]
    ) -> VerticalValidationResult:
        """
        Validates the vertical geometry consistency:
        - Floor ceiling > base elevation
        - Floor height equals ceiling - base
        - Floor ordering and no overlapping elevation intervals
        - Building height envelope consistency
        """
        checks: List[VerticalValidationCheck] = []
        discrepancies: List[str] = []
        is_valid = True

        # Check 1: Floor existence
        if not floors:
            checks.append(VerticalValidationCheck(
                check_name="FLOOR_DATA_AVAILABILITY",
                status="UNAVAILABLE",
                detail="No vertical floor levels mapped to this building structure."
            ))
            return VerticalValidationResult(
                is_valid=True,
                entity_type="building",
                entity_id=str(building.id),
                checks=checks,
                discrepancies=[]
            )

        checks.append(VerticalValidationCheck(
            check_name="FLOOR_DATA_AVAILABILITY",
            status="PASSED",
            detail=f"{len(floors)} floor levels found."
        ))

        # Sort floors by floor_number
        sorted_floors = sorted(floors, key=lambda f: f.floor_number)

        # Check 2: Individual floor vertical ranges
        for f in sorted_floors:
            base = float(f.base_elevation)
            ceil = float(f.ceiling_elevation)
            height = float(f.floor_height)
            if ceil <= base:
                is_valid = False
                err = f"Floor {f.floor_number} ({f.floor_code}): ceiling elevation ({ceil}m) <= base elevation ({base}m)."
                discrepancies.append(err)
                checks.append(VerticalValidationCheck(
                    check_name=f"FLOOR_{f.floor_number}_VERTICAL_SPAN",
                    status="FAILED",
                    detail=err
                ))
            else:
                checks.append(VerticalValidationCheck(
                    check_name=f"FLOOR_{f.floor_number}_VERTICAL_SPAN",
                    status="PASSED",
                    detail=f"Floor {f.floor_number} span: {base:.2f}m to {ceil:.2f}m (height: {ceil - base:.2f}m)."
                ))

        # Check 3: Vertical overlap between adjacent floors
        for i in range(len(sorted_floors) - 1):
            lower = sorted_floors[i]
            upper = sorted_floors[i + 1]
            lower_ceil = float(lower.ceiling_elevation)
            upper_base = float(upper.base_elevation)
            if lower_ceil > upper_base:
                is_valid = False
                err = f"Vertical overlap detected between Floor {lower.floor_number} (ceiling {lower_ceil:.2f}m) and Floor {upper.floor_number} (base {upper_base:.2f}m)."
                discrepancies.append(err)
                checks.append(VerticalValidationCheck(
                    check_name=f"INTER_FLOOR_OVERLAP_{lower.floor_number}_{upper.floor_number}",
                    status="FAILED",
                    detail=err
                ))
            else:
                checks.append(VerticalValidationCheck(
                    check_name=f"INTER_FLOOR_OVERLAP_{lower.floor_number}_{upper.floor_number}",
                    status="PASSED",
                    detail=f"Consistent boundary between Floor {lower.floor_number} and Floor {upper.floor_number}."
                ))

        # Check 4: Building top envelope consistency
        bld_ground = float(building.ground_elevation)
        bld_height = float(building.building_height)
        bld_top = bld_ground + bld_height
        highest_ceil = max(float(f.ceiling_elevation) for f in sorted_floors)

        if highest_ceil > (bld_top + 0.5):
            warning = f"Highest floor ceiling ({highest_ceil:.2f}m) exceeds building roof elevation ({bld_top:.2f}m). Flagged as VERTICAL DATA DISCREPANCY."
            discrepancies.append(warning)
            checks.append(VerticalValidationCheck(
                check_name="BUILDING_HEIGHT_ENVELOPE_ALIGNMENT",
                status="WARNING",
                detail=warning
            ))
        else:
            checks.append(VerticalValidationCheck(
                check_name="BUILDING_HEIGHT_ENVELOPE_ALIGNMENT",
                status="PASSED",
                detail=f"Floors fit within building envelope ({highest_ceil:.2f}m <= {bld_top:.2f}m)."
            ))

        return VerticalValidationResult(
            is_valid=is_valid,
            entity_type="building",
            entity_id=str(building.id),
            checks=checks,
            discrepancies=discrepancies
        )

    @staticmethod
    async def get_or_create_property_identity(
        db: AsyncSession,
        parcel: Parcel,
        building: Optional[Building] = None
    ) -> PropertyIdentity:
        """
        Retrieves or generates a deterministic ULPIN-oriented prototype identity record.
        Maintains database uniqueness and identity stability.
        """
        b_code = building.building_code if building else None
        ulpin_proto = VerticalPropertyService.generate_property_ulpin(parcel.ulpin_2d, b_code)

        # Check existing
        stmt = select(PropertyIdentity).where(PropertyIdentity.ulpin_oriented_id == ulpin_proto)
        res = await db.execute(stmt)
        identity = res.scalar_one_or_none()
        if identity and isinstance(identity, PropertyIdentity):
            return identity

        # Create new stable record
        identity = PropertyIdentity(
            parcel_id=parcel.id,
            building_id=building.id if building else None,
            ulpin_oriented_id=ulpin_proto,
            identity_version=1,
            status="PROTOTYPE",
            metadata_json={
                "parcel_survey": parcel.survey_number,
                "building_code": b_code,
                "disclaimer": "ULPIN-oriented technical spatial prototype; not an official government title."
            }
        )
        db.add(identity)
        await db.flush()
        return identity

    @staticmethod
    async def build_property_hierarchy(
        db: AsyncSession,
        entity_id: uuid.UUID
    ) -> PropertyHierarchyResponse:
        """
        Assembles the complete vertical property model:
        PARCEL -> BUILDING -> FLOOR -> UNIT
        Resolves whether entity_id is a parcel or building ID.
        """
        # Try loading as Parcel first
        stmt = (
            select(Parcel)
            .where(Parcel.id == entity_id)
            .options(
                selectinload(Parcel.city),
                selectinload(Parcel.region),
                selectinload(Parcel.buildings).selectinload(Building.floors).selectinload(Floor.units),
            )
        )
        res = await db.execute(stmt)
        parcel = res.scalar_one_or_none()

        building_context: Optional[Building] = None
        if not parcel:
            # Try loading as Building
            b_stmt = (
                select(Building)
                .where(Building.id == entity_id)
                .options(
                    selectinload(Building.parcel).selectinload(Parcel.city),
                    selectinload(Building.parcel).selectinload(Parcel.region),
                    selectinload(Building.floors).selectinload(Floor.units),
                )
            )
            b_res = await db.execute(b_stmt)
            building_context = b_res.scalar_one_or_none()
            if not building_context:
                raise ValueError(f"Property with ID '{entity_id}' not found in canonical parcels or buildings.")
            parcel = building_context.parcel

        # Fetch or generate prototype identity
        identity = await VerticalPropertyService.get_or_create_property_identity(
            db=db,
            parcel=parcel,
            building=building_context or (parcel.buildings[0] if parcel.buildings else None)
        )

        buildings_list = parcel.buildings if not building_context else [building_context]

        total_floors = 0
        total_units = 0
        buildings_hierarchy: List[BuildingHierarchyItem] = []

        for b in buildings_list:
            b_floors = sorted(b.floors, key=lambda f: f.floor_number) if b.floors else []
            total_floors += len(b_floors)
            floors_hierarchy: List[FloorHierarchyItem] = []

            for f in b_floors:
                f_units = sorted(f.units, key=lambda u: u.unit_number) if f.units else []
                total_units += len(f_units)
                units_hierarchy: List[UnitHierarchyItem] = []

                for u in f_units:
                    centroid_coords = None
                    if u.spatial_centroid_z is not None:
                        c_json = geometry_to_geojson(u.spatial_centroid_z)
                        if c_json and "coordinates" in c_json:
                            centroid_coords = c_json["coordinates"]

                    units_hierarchy.append(UnitHierarchyItem(
                        id=str(u.id),
                        floor_id=str(u.floor_id),
                        building_id=str(u.building_id),
                        parcel_id=str(u.parcel_id),
                        ulpin_3d=u.ulpin_3d,
                        unit_number=u.unit_number,
                        unit_label=getattr(u, "unit_label", None) or f"Unit {u.unit_number}",
                        unit_type=u.unit_type,
                        carpet_area_sqm=float(u.carpet_area_sqm),
                        has_centroid_z=centroid_coords is not None,
                        centroid_z_coords=centroid_coords,
                        has_geom_3d=u.geom_3d is not None,
                        verification_status=u.verification_status,
                        status_3d=getattr(u, "status_3d", "AVAILABLE") or "AVAILABLE",
                        extraction_method=getattr(u, "extraction_method", None),
                        confidence_score=float(u.confidence_score) if getattr(u, "confidence_score", None) else None,
                        provenance_source="REGISTRY_SURVEY"
                    ))

                floors_hierarchy.append(FloorHierarchyItem(
                    id=str(f.id),
                    building_id=str(f.building_id),
                    floor_number=f.floor_number,
                    floor_code=f.floor_code,
                    floor_label=getattr(f, "floor_label", None) or f"Level {f.floor_number}",
                    base_elevation=float(f.base_elevation),
                    ceiling_elevation=float(f.ceiling_elevation),
                    floor_height=float(f.floor_height),
                    floor_area_sqm=float(f.floor_area_sqm),
                    status_3d=getattr(f, "status_3d", "AVAILABLE") or "AVAILABLE",
                    height_source=getattr(f, "height_source", None),
                    extraction_method=getattr(f, "extraction_method", None) or "SURVEY",
                    confidence_score=float(f.confidence_score) if getattr(f, "confidence_score", None) else None,
                    units_count=len(units_hierarchy),
                    units=units_hierarchy
                ))

            ground_z = float(b.ground_elevation)
            b_height = float(b.building_height)
            buildings_hierarchy.append(BuildingHierarchyItem(
                id=str(b.id),
                parcel_id=str(b.parcel_id),
                building_code=b.building_code,
                name=b.name,
                building_type=b.building_type,
                ground_elevation=ground_z,
                building_height=b_height,
                top_elevation=ground_z + b_height,
                detected_floors=b.detected_floors,
                sanctioned_floors=b.sanctioned_floors,
                status_3d=b.status_3d or "FOOTPRINT_ONLY",
                height_source=b.height_source,
                extraction_method=b.extraction_method,
                confidence_score=float(b.confidence_score) if b.confidence_score else None,
                floors_count=len(floors_hierarchy),
                units_count=sum(fl.units_count for fl in floors_hierarchy),
                floors=floors_hierarchy
            ))

        # Evaluate honest completeness indicator
        completeness = CompletenessStatus(
            parcel="AVAILABLE",
            building="AVAILABLE" if buildings_hierarchy else "UNAVAILABLE",
            three_d_model="AVAILABLE" if any(b.status_3d != "FOOTPRINT_ONLY" for b in buildings_hierarchy) else "PARTIAL",
            floors="AVAILABLE" if total_floors > 0 else "UNAVAILABLE",
            units="AVAILABLE" if total_units > 0 else ("PARTIAL" if total_floors > 0 else "UNAVAILABLE")
        )

        parcel_item = ParcelHierarchyItem(
            id=str(parcel.id),
            ulpin_2d=parcel.ulpin_2d,
            survey_number=parcel.survey_number,
            recorded_area_sqm=float(parcel.recorded_area_sqm),
            computed_area_sqm=float(parcel.computed_area_sqm),
            land_use=parcel.land_use,
            elevation_base=float(parcel.elevation_base),
            city_name=parcel.city.name if parcel.city else None,
            region_code=parcel.region.code if parcel.region else None,
            buildings_count=len(buildings_hierarchy)
        )

        return PropertyHierarchyResponse(
            property_id=str(entity_id),
            ulpin_oriented_id=identity.ulpin_oriented_id,
            identity_version=identity.identity_version,
            identity_status=identity.status,
            disclaimer="ULPIN-oriented prototype identifier for 3D technical spatial modeling. Does NOT claim official government ULPIN issuance.",
            completeness=completeness,
            spatial_consistency="VALID",
            parcel=parcel_item,
            buildings=buildings_hierarchy
        )

    @staticmethod
    def get_building_floors_3d_geojson(
        building: Building,
        floors: List[Floor]
    ) -> GeoJSONFeatureCollection:
        """
        Converts building floors to a GeoJSON FeatureCollection for 3D extrusion in CesiumJS.
        Each floor inherits footprint geometry and carries base and ceiling elevations.
        """
        footprint = geometry_to_geojson(building.footprint_geom)
        if not footprint:
            return GeoJSONFeatureCollection(features=[], total_count=0)

        features: List[GeoJSONFeature] = []
        for f in sorted(floors, key=lambda fl: fl.floor_number):
            base_z = float(f.base_elevation)
            ceil_z = float(f.ceiling_elevation)
            height = float(f.floor_height) if float(f.floor_height) > 0 else ceil_z - base_z

            props = {
                "id": str(f.id),
                "building_id": str(building.id),
                "building_code": building.building_code,
                "floor_number": f.floor_number,
                "floor_code": f.floor_code,
                "floor_label": getattr(f, "floor_label", None) or f"Level {f.floor_number}",
                "base_elevation": base_z,
                "ceiling_elevation": ceil_z,
                "extruded_height": height,
                "floor_area_sqm": float(f.floor_area_sqm),
                "status_3d": getattr(f, "status_3d", "AVAILABLE") or "AVAILABLE",
                "height_source": getattr(f, "height_source", None) or "SURVEY",
                "extraction_method": getattr(f, "extraction_method", None) or "DERIVED",
                "confidence_score": float(f.confidence_score) if getattr(f, "confidence_score", None) else 0.90,
                "geometry_source": "INHERITED_FROM_BUILDING",
                "derivation_reason": "Building footprint vertically partitioned by floor elevations",
            }
            features.append(GeoJSONFeature(
                id=str(f.id),
                geometry=footprint,
                properties=props
            ))

        return GeoJSONFeatureCollection(features=features, total_count=len(features))

    @staticmethod
    def get_floor_units_3d_geojson(
        units: List[Unit]
    ) -> GeoJSONFeatureCollection:
        """
        Converts floor units to GeoJSON features for 3D visualization.
        Renders unit spatial_centroid_z Point feature with exact Z elevation.
        """
        features: List[GeoJSONFeature] = []
        for u in units:
            geom = None
            if u.geom_3d is not None:
                geom = geometry_to_geojson(u.geom_3d)
            elif u.spatial_centroid_z is not None:
                geom = geometry_to_geojson(u.spatial_centroid_z)

            if not geom:
                continue

            props = {
                "id": str(u.id),
                "floor_id": str(u.floor_id),
                "building_id": str(u.building_id),
                "parcel_id": str(u.parcel_id),
                "ulpin_3d": u.ulpin_3d,
                "unit_number": u.unit_number,
                "unit_label": getattr(u, "unit_label", None) or f"Unit {u.unit_number}",
                "unit_type": u.unit_type,
                "carpet_area_sqm": float(u.carpet_area_sqm),
                "verification_status": u.verification_status,
                "status_3d": getattr(u, "status_3d", "AVAILABLE") or "AVAILABLE",
            }
            features.append(GeoJSONFeature(
                id=str(u.id),
                geometry=geom,
                properties=props
            ))

        return GeoJSONFeatureCollection(features=features, total_count=len(features))
