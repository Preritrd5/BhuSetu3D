"""
BhuSetu 3D — PostGIS Urban Environment Synchronizer
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Spatial Hierarchy & Digital Twin Integration

Seeds/Upserts the authoritative 24 Cadastral Parcels and 24 Multi-Typology Buildings
into Supabase PostgreSQL/PostGIS. Preserves existing demo UUIDs (P-101, P-102, P-103)
while establishing deterministic, reproducible UUIDs for all other properties.
"""
import uuid
import json
import os
import sys
from decimal import Decimal
from datetime import datetime, timezone
import shapely.geometry
from geoalchemy2.shape import from_shape
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import AsyncSessionLocal
from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit

CITY_BLR_ID = uuid.UUID("11111111-1111-4000-8000-000000000001")
REGION_MALL_ID = uuid.UUID("22222222-2222-4000-8000-000000000001")

# Known legacy UUID mappings for the primary demo properties
KNOWN_PARCEL_UUIDS = {
    "PARCEL-001": uuid.UUID("66666666-6666-4000-8000-000000000102"), # P-102 (Hero)
    "PARCEL-002": uuid.UUID("66666666-6666-4000-8000-000000000101"), # P-101
    "PARCEL-003": uuid.UUID("66666666-6666-4000-8000-000000000103"), # P-103
}

KNOWN_BUILDING_UUIDS = {
    "BLDG-001": uuid.UUID("77777777-7777-4000-8000-000000000102"), # Aura Horizon
    "BLDG-002": uuid.UUID("77777777-7777-4000-8000-000000000101"), # Malleshwaram Residency
    "BLDG-003": uuid.UUID("77777777-7777-4000-8000-000000000103"), # Green Valley Arcade
}


def get_parcel_uuid(parcel_id_str: str) -> uuid.UUID:
    if parcel_id_str in KNOWN_PARCEL_UUIDS:
        return KNOWN_PARCEL_UUIDS[parcel_id_str]
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"bhusetu.parcel.{parcel_id_str}")


def get_building_uuid(building_id_str: str) -> uuid.UUID:
    if building_id_str in KNOWN_BUILDING_UUIDS:
        return KNOWN_BUILDING_UUIDS[building_id_str]
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"bhusetu.building.{building_id_str}")


async def sync_urban_environment():
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../urban_environment_seed.json"))
    if not os.path.exists(json_path):
        print(f"Error: JSON file not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    parcels_data = data.get("parcels", [])
    buildings_data = data.get("buildings", [])

    print(f"Loaded {len(parcels_data)} parcels and {len(buildings_data)} buildings from JSON.")

    async with AsyncSessionLocal() as session:
        # 1. Verify City and Region exist
        city = await session.get(City, CITY_BLR_ID)
        if not city:
            city = City(
                id=CITY_BLR_ID,
                name="Bengaluru",
                code="BLR",
                state="Karnataka",
                country="India",
                center_lon=Decimal("77.5946"),
                center_lat=Decimal("12.9716"),
            )
            session.add(city)
            await session.flush()

        region = await session.get(Region, REGION_MALL_ID)
        if not region:
            reg_poly = shapely.geometry.Polygon([
                [77.560, 12.990],
                [77.580, 12.990],
                [77.580, 13.010],
                [77.560, 13.010],
                [77.560, 12.990],
            ])
            region = Region(
                id=REGION_MALL_ID,
                city_id=CITY_BLR_ID,
                name="Malleshwaram Zone",
                code="MALL-W101",
                geom_2d=from_shape(reg_poly, srid=4326),
            )
            session.add(region)
            await session.flush()

        # 2. Sync Parcels
        parcel_id_to_uuid = {}
        for p in parcels_data:
            p_id = p["parcelId"]
            p_uuid = get_parcel_uuid(p_id)
            parcel_id_to_uuid[p_id] = p_uuid

            existing = await session.get(Parcel, p_uuid)
            poly = shapely.geometry.Polygon(p["footprint"])
            geom = from_shape(poly, srid=4326)

            if existing:
                # Update attributes
                existing.survey_number = p.get("surveyNumber", existing.survey_number)
                existing.ulpin_2d = p.get("ulpin", existing.ulpin_2d)
                existing.land_use = p.get("category", existing.land_use)
                existing.recorded_area_sqm = Decimal(str(p.get("areaSqm", existing.recorded_area_sqm)))
                existing.computed_area_sqm = Decimal(str(p.get("areaSqm", existing.computed_area_sqm)))
                existing.geom_2d = geom
                print(f"Updated Parcel {p_id} ({p_uuid})")
            else:
                new_parcel = Parcel(
                    id=p_uuid,
                    city_id=CITY_BLR_ID,
                    region_id=REGION_MALL_ID,
                    ulpin_2d=p["ulpin"],
                    survey_number=p["surveyNumber"],
                    recorded_area_sqm=Decimal(str(p["areaSqm"])),
                    computed_area_sqm=Decimal(str(p["areaSqm"])),
                    land_use=p["category"],
                    geom_2d=geom,
                    elevation_base=Decimal("0.0"),
                )
                session.add(new_parcel)
                print(f"Created Parcel {p_id} ({p_uuid})")

        await session.flush()

        # 3. Sync Buildings
        for b in buildings_data:
            b_id = b["buildingId"]
            b_uuid = get_building_uuid(b_id)
            parent_parcel_id = b["parcelId"]
            parent_parcel_uuid = parcel_id_to_uuid.get(parent_parcel_id, get_parcel_uuid(parent_parcel_id))

            existing_b = await session.get(Building, b_uuid)
            poly = shapely.geometry.Polygon(b["footprint"])
            geom = from_shape(poly, srid=4326)
            b_height = Decimal(str(b["height"]))
            flr_count = int(b["floorCount"])

            metadata = {
                "buildingId": b_id,
                "typology": b["typology"],
                "roofType": b.get("roofType", "FLAT_PARAPET"),
                "propertyStatus": b.get("propertyStatus", "VERIFIED"),
                "isPrimaryDemo": b.get("isPrimaryDemo", False),
                "provenance": "DEMO_SYNTHETIC",
                "accuracy": "HIGH",
                "status": "ILLUSTRATIVE",
            }

            if existing_b:
                existing_b.parcel_id = parent_parcel_uuid
                existing_b.building_code = b.get("code", existing_b.building_code)
                existing_b.name = b.get("name", existing_b.name)
                existing_b.building_type = b.get("typologyLabel", existing_b.building_type)
                existing_b.building_height = b_height
                existing_b.sanctioned_floors = flr_count
                existing_b.detected_floors = flr_count + (1 if b.get("hasConflict") else 0)
                existing_b.footprint_geom = geom
                existing_b.height_source = "DEMO_SYNTHETIC"
                existing_b.extraction_method = "ILLUSTRATIVE_DIGITAL_TWIN"
                existing_b.confidence_score = Decimal("0.95")
                existing_b.processing_version = "v2.4-sih"
                existing_b.status_3d = "LOD3_DETAILED" if b.get("isPrimaryDemo") else "LOD2_PROCEDURAL"
                existing_b.metadata_json = metadata
                print(f"Updated Building {b_id} ({b_uuid}) on parcel {parent_parcel_id}")
            else:
                new_b = Building(
                    id=b_uuid,
                    parcel_id=parent_parcel_uuid,
                    building_code=b["code"],
                    name=b["name"],
                    building_type=b["typologyLabel"],
                    footprint_geom=geom,
                    ground_elevation=Decimal("0.0"),
                    building_height=b_height,
                    detected_floors=flr_count + (1 if b.get("hasConflict") else 0),
                    sanctioned_floors=flr_count,
                    height_source="DEMO_SYNTHETIC",
                    extraction_method="ILLUSTRATIVE_DIGITAL_TWIN",
                    confidence_score=Decimal("0.95"),
                    processing_version="v2.4-sih",
                    status_3d="LOD3_DETAILED" if b.get("isPrimaryDemo") else "LOD2_PROCEDURAL",
                    metadata_json=metadata,
                )
                session.add(new_b)
                print(f"Created Building {b_id} ({b_uuid}) on parcel {parent_parcel_id}")

        await session.flush()

        # 4. Create Floors and Units for buildings that lack them
        for b in buildings_data:
            b_id = b["buildingId"]
            b_uuid = get_building_uuid(b_id)
            parent_parcel_id = b["parcelId"]
            parent_parcel_uuid = parcel_id_to_uuid.get(parent_parcel_id, get_parcel_uuid(parent_parcel_id))
            existing_floors = (await session.execute(select(Floor).where(Floor.building_id == b_uuid))).scalars().all()
            
            if not existing_floors:
                flr_count = max(int(b["floorCount"]), 1)
                flr_h = float(b["height"]) / flr_count
                for f_idx in range(flr_count):
                    f_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"bhusetu.floor.{b_id}.{f_idx}")
                    f_code = f"FL-{f_idx+1:02d}"
                    z_base = Decimal(str(round(f_idx * flr_h, 2)))
                    z_ceil = Decimal(str(round((f_idx + 1) * flr_h, 2)))
                    f_height = Decimal(str(round(flr_h, 2)))
                    new_floor = Floor(
                        id=f_uuid,
                        building_id=b_uuid,
                        floor_number=f_idx,
                        floor_code=f_code,
                        base_elevation=z_base,
                        ceiling_elevation=z_ceil,
                        floor_height=f_height,
                        floor_area_sqm=Decimal("120.00"),
                    )
                    session.add(new_floor)
                    await session.flush()

                    # Add 1 unit per floor
                    u_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"bhusetu.unit.{b_id}.{f_idx}.1")
                    u_no = f"Unit {(f_idx+1)*100 + 1}"
                    ulpin_3d = f"{b['code']}-F{f_idx+1:02d}-U01"
                    u_pt = shapely.geometry.Point(b["centroid"][0], b["centroid"][1], float(z_base) + 1.5)
                    new_unit = Unit(
                        id=u_uuid,
                        floor_id=f_uuid,
                        building_id=b_uuid,
                        parcel_id=parent_parcel_uuid,
                        unit_number=u_no,
                        ulpin_3d=ulpin_3d,
                        carpet_area_sqm=Decimal("85.00"),
                        unit_type="COMMERCIAL" if "COMMERCIAL" in b.get("typologyLabel", "").upper() else "RESIDENTIAL",
                        spatial_centroid_z=from_shape(u_pt, srid=4326),
                        verification_status="VERIFIED",
                        status_3d="AVAILABLE",
                    )
                    session.add(new_unit)

        await session.commit()
        print("Successfully synchronized all 24 parcels and 24 buildings with PostGIS!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(sync_urban_environment())
