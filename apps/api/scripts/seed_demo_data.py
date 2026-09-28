"""
BhuSetu 3D Deterministic SIH Demo Dataset Seed Script
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 15: Complete SIH Demo Integration + Final Validation

Scenario: BHUSETU-DEMO-01
City: Bengaluru (BLR) | Region: Malleshwaram Zone (W-101)
Primary Showcase Property: KA-BLR-2026-P102 (Survey 102/3B)
"""
import uuid
import hashlib
import json
from decimal import Decimal
from datetime import datetime, date, timezone
import shapely.geometry
from geoalchemy2.shape import from_shape

import sys
import os

# Insert apps/api root into sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, delete, text
from app.database.connection import AsyncSessionLocal, engine
from app.models.city import City
from app.models.region import Region
from app.models.user import User
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.infrastructure import Infrastructure, ParcelInfrastructure
from app.models.provenance import (
    DataSource,
    Dataset,
    Evidence,
    ProvenanceRecord,
    Conflict,
    SpatialRule,
    VerificationRecord,
    AuditLog,
)
from app.models.property_identity import PropertyIdentity
from app.models.temporal import PropertyStateVersion, ChangeEvent
from app.models.quality import QualityScoreSnapshot, QualityIssue


# Deterministic Static UUIDs for Demo Scenario Reproducibility
CITY_BLR_ID = uuid.UUID("11111111-1111-4000-8000-000000000001")
REGION_MALL_ID = uuid.UUID("22222222-2222-4000-8000-000000000001")

USER_ADMIN_ID = uuid.UUID("33333333-3333-4000-8000-000000000001")
USER_OFFICER_ID = uuid.UUID("33333333-3333-4000-8000-000000000002")
USER_SURVEYOR_ID = uuid.UUID("33333333-3333-4000-8000-000000000003")
USER_ANALYST_ID = uuid.UUID("33333333-3333-4000-8000-000000000004")

SOURCE_KSRSAC_ID = uuid.UUID("44444444-4444-4000-8000-000000000001")
SOURCE_SOI_ID = uuid.UUID("44444444-4444-4000-8000-000000000002")
SOURCE_BBMP_ID = uuid.UUID("44444444-4444-4000-8000-000000000003")

DATASET_SAT_2024_ID = uuid.UUID("55555555-5555-4000-8000-000000000001")
DATASET_LIDAR_2025_ID = uuid.UUID("55555555-5555-4000-8000-000000000002")
DATASET_DRONE_2026_ID = uuid.UUID("55555555-5555-4000-8000-000000000003")
DATASET_CADASTRE_ID = uuid.UUID("55555555-5555-4000-8000-000000000004")

# Showcase Property P-102 (The Hero Property)
PARCEL_P102_ID = uuid.UUID("66666666-6666-4000-8000-000000000102")
BUILDING_B102_ID = uuid.UUID("77777777-7777-4000-8000-000000000102")
FLOOR_P102_F0_ID = uuid.UUID("88888888-8888-4000-8000-000000001020")
FLOOR_P102_F1_ID = uuid.UUID("88888888-8888-4000-8000-000000001021")
FLOOR_P102_F2_ID = uuid.UUID("88888888-8888-4000-8000-000000001022")
FLOOR_P102_F3_ID = uuid.UUID("88888888-8888-4000-8000-000000001023")

UNIT_P102_U01_ID = uuid.UUID("99999999-9999-4000-8000-000000001021")
UNIT_P102_U02_ID = uuid.UUID("99999999-9999-4000-8000-000000001022")
UNIT_P102_U03_ID = uuid.UUID("99999999-9999-4000-8000-000000001023")
UNIT_P102_U04_ID = uuid.UUID("99999999-9999-4000-8000-000000001024")

# Reference Compliant Property P-101
PARCEL_P101_ID = uuid.UUID("66666666-6666-4000-8000-000000000101")
BUILDING_B101_ID = uuid.UUID("77777777-7777-4000-8000-000000000101")
FLOOR_P101_F0_ID = uuid.UUID("88888888-8888-4000-8000-000000001010")
FLOOR_P101_F1_ID = uuid.UUID("88888888-8888-4000-8000-000000001011")
FLOOR_P101_F2_ID = uuid.UUID("88888888-8888-4000-8000-000000001012")
UNIT_P101_U01_ID = uuid.UUID("99999999-9999-4000-8000-000000001011")

# Reference Incomplete Property P-103
PARCEL_P103_ID = uuid.UUID("66666666-6666-4000-8000-000000000103")
BUILDING_B103_ID = uuid.UUID("77777777-7777-4000-8000-000000000103")

# Infrastructure Assets
INFRA_ROAD_ID = uuid.UUID("aaaaaaaa-aaaa-4000-8000-000000000001")
INFRA_DRAIN_ID = uuid.UUID("aaaaaaaa-aaaa-4000-8000-000000000002")
INFRA_WATER_ID = uuid.UUID("aaaaaaaa-aaaa-4000-8000-000000000003")

# 4D Historical State Versions
VERSION_2024_ID = uuid.UUID("bbbbbbbb-bbbb-4000-8000-000000002024")
VERSION_2025_ID = uuid.UUID("bbbbbbbb-bbbb-4000-8000-000000002025")
VERSION_2026_ID = uuid.UUID("bbbbbbbb-bbbb-4000-8000-000000002026")

CHANGE_EVENT_ID = uuid.UUID("cccccccc-cccc-4000-8000-000000000001")
CONFLICT_SETBACK_ID = uuid.UUID("dddddddd-dddd-4000-8000-000000000001")
CONFLICT_HEIGHT_ID = uuid.UUID("dddddddd-dddd-4000-8000-000000000002")
VERIFICATION_REC_ID = uuid.UUID("eeeeeeee-eeee-4000-8000-000000000001")


def calc_sha256(data_str: str) -> str:
    return hashlib.sha256(data_str.encode("utf-8")).hexdigest()


async def seed_demo_database():
    print("=" * 70)
    print("BHUSETU 3D: SEEDING DETERMINISTIC SIH DEMO DATASET (BHUSETU-DEMO-01)")
    print("=" * 70)

    async with AsyncSessionLocal() as session:
        # Check if already seeded to ensure idempotency
        res = await session.execute(select(Parcel).filter(Parcel.id == PARCEL_P102_ID))
        existing_p102 = res.scalar_one_or_none()
        if existing_p102:
            print("Notice: Showcase property P-102 already exists. Cleaning scenario for idempotent reseed...")
            # Clean up demo records safely in topological order
            await session.execute(text("DELETE FROM public.quality_issues WHERE entity_id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101', '66666666-6666-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.quality_score_snapshots WHERE entity_id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101', '66666666-6666-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.verification_records WHERE id = 'eeeeeeee-eeee-4000-8000-000000000001';"))
            await session.execute(text("DELETE FROM public.conflicts WHERE id IN ('dddddddd-dddd-4000-8000-000000000001', 'dddddddd-dddd-4000-8000-000000000002');"))
            await session.execute(text("DELETE FROM public.change_events WHERE id = 'cccccccc-cccc-4000-8000-000000000001';"))
            await session.execute(text("DELETE FROM public.property_state_versions WHERE entity_id = '77777777-7777-4000-8000-000000000102';"))
            await session.execute(text("DELETE FROM public.provenance_records WHERE target_entity_id IN ('66666666-6666-4000-8000-000000000102', '77777777-7777-4000-8000-000000000102');"))
            await session.execute(text("DELETE FROM public.evidence WHERE entity_id IN ('66666666-6666-4000-8000-000000000102', '77777777-7777-4000-8000-000000000102');"))
            await session.execute(text("DELETE FROM public.property_identities WHERE parcel_id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101', '66666666-6666-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.parcel_infrastructure WHERE parcel_id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101');"))
            await session.execute(text("DELETE FROM public.units WHERE parcel_id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101');"))
            await session.execute(text("DELETE FROM public.floors WHERE building_id IN ('77777777-7777-4000-8000-000000000102', '77777777-7777-4000-8000-000000000101', '77777777-7777-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.buildings WHERE id IN ('77777777-7777-4000-8000-000000000102', '77777777-7777-4000-8000-000000000101', '77777777-7777-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.parcels WHERE id IN ('66666666-6666-4000-8000-000000000102', '66666666-6666-4000-8000-000000000101', '66666666-6666-4000-8000-000000000103');"))
            await session.execute(text("DELETE FROM public.infrastructure WHERE id IN ('aaaaaaaa-aaaa-4000-8000-000000000001', 'aaaaaaaa-aaaa-4000-8000-000000000002', 'aaaaaaaa-aaaa-4000-8000-000000000003');"))
            await session.commit()
            print("Existing scenario cleaned.")

        # ---------------------------------------------------------------------
        # 1. CITIES & REGIONS
        # ---------------------------------------------------------------------
        print("1. Seeding City and Region...")
        blr_poly = shapely.geometry.Polygon([
            (77.500, 12.900), (77.700, 12.900), (77.700, 13.050), (77.500, 13.050), (77.500, 12.900)
        ])
        city_blr = City(
            id=CITY_BLR_ID,
            code="BLR",
            name="Bengaluru Municipal Corporation",
            state="Karnataka",
            country="India",
            default_srid=4326,
            bounds_geom=from_shape(blr_poly, srid=4326),
        )
        session.add(city_blr)

        mall_multipoly = shapely.geometry.MultiPolygon([
            shapely.geometry.Polygon([
                (77.560, 12.990), (77.585, 12.990), (77.585, 13.015), (77.560, 13.015), (77.560, 12.990)
            ])
        ])
        region_mall = Region(
            id=REGION_MALL_ID,
            city_id=CITY_BLR_ID,
            code="W-101",
            name="Malleshwaram Zone",
            boundary_geom=from_shape(mall_multipoly, srid=4326),
        )
        session.add(region_mall)
        await session.flush()

        # ---------------------------------------------------------------------
        # 2. USERS
        # ---------------------------------------------------------------------
        print("2. Seeding Authorized Departmental Users...")
        users = [
            User(
                id=USER_ADMIN_ID,
                email="admin.official@bhusetu3d.gov.in",
                full_name="Vikram Sen",
                role="ADMIN",
                department="Urban Development Directorate",
                is_active=True,
            ),
            User(
                id=USER_OFFICER_ID,
                email="officer.kavita@bhusetu3d.gov.in",
                full_name="Kavita Sharma",
                role="GOVERNMENT_OFFICER",
                department="Revenue & Cadastral Administration",
                is_active=True,
            ),
            User(
                id=USER_SURVEYOR_ID,
                email="surveyor.rao@bhusetu3d.gov.in",
                full_name="Sunil Rao",
                role="SURVEYOR",
                department="Directorate of Survey & Land Records",
                is_active=True,
            ),
            User(
                id=USER_ANALYST_ID,
                email="analyst.priya@bhusetu3d.gov.in",
                full_name="Priya Nair",
                role="ANALYST",
                department="GIS & Spatial Intelligence Unit",
                is_active=True,
            ),
        ]
        for u in users:
            session.add(u)
        await session.flush()

        # ---------------------------------------------------------------------
        # 3. DATA SOURCES & DATASETS
        # ---------------------------------------------------------------------
        print("3. Seeding Data Sources & Spatial Datasets...")
        src_ksrsac = DataSource(
            id=SOURCE_KSRSAC_ID,
            name="Karnataka State Remote Sensing Applications Centre (KSRSAC)",
            organization_type="GOVERNMENT_AGENCY",
            trust_level="AUTHORITATIVE",
            contact_email="spatial.ksrsac@karnataka.gov.in",
            reliability_score=Decimal("0.960"),
        )
        src_soi = DataSource(
            id=SOURCE_SOI_ID,
            name="Survey of India (SOI)",
            organization_type="NATIONAL_MAPPING_AGENCY",
            trust_level="AUTHORITATIVE",
            contact_email="director.karnataka@surveyofindia.gov.in",
            reliability_score=Decimal("0.990"),
        )
        src_bbmp = DataSource(
            id=SOURCE_BBMP_ID,
            name="Bruhat Bengaluru Mahanagara Palike (BBMP) Town Planning",
            organization_type="MUNICIPAL_BODY",
            trust_level="AUTHORITATIVE",
            contact_email="townplanning@bbmp.gov.in",
            reliability_score=Decimal("0.910"),
        )
        session.add_all([src_ksrsac, src_soi, src_bbmp])
        await session.flush()

        ds_sat_2024 = Dataset(
            id=DATASET_SAT_2024_ID,
            source_id=SOURCE_KSRSAC_ID,
            city_id=CITY_BLR_ID,
            name="2024 High-Resolution Optical Satellite Imagery (0.3m)",
            dataset_type="SATELLITE_IMAGERY",
            acquisition_date=date(2024, 2, 15),
            sensor_details="Cartosat-3 PAN/MX Optical Sensor",
            storage_uri="s3://bhusetu-imagery/blr/2024/ortho_03m.tif",
        )
        ds_lidar_2025 = Dataset(
            id=DATASET_LIDAR_2025_ID,
            source_id=SOURCE_SOI_ID,
            city_id=CITY_BLR_ID,
            name="2025 Airborne LiDAR Elevation Survey — Malleshwaram",
            dataset_type="LIDAR_POINT_CLOUD",
            acquisition_date=date(2025, 3, 10),
            sensor_details="Leica TerrainMapper-2 Airborne LiDAR",
            storage_uri="s3://bhusetu-elevation/blr/2025/malleshwaram_lidar.laz",
        )
        ds_drone_2026 = Dataset(
            id=DATASET_DRONE_2026_ID,
            source_id=SOURCE_BBMP_ID,
            city_id=CITY_BLR_ID,
            name="2026 Drone Photogrammetry & 3D Reality Mesh",
            dataset_type="DRONE_PHOTOGRAMMETRY",
            acquisition_date=date(2026, 1, 20),
            sensor_details="DJI Matrice 300 RTK + Zenmuse P1",
            storage_uri="s3://bhusetu-mesh/blr/2026/w101_reality_mesh.3dtiles",
        )
        ds_cadastre = Dataset(
            id=DATASET_CADASTRE_ID,
            source_id=SOURCE_SOI_ID,
            city_id=CITY_BLR_ID,
            name="Bengaluru Digital Cadastral Boundary Layer v2.1",
            dataset_type="CADASTRAL_SURVEY",
            acquisition_date=date(2020, 8, 12),
            sensor_details="DGPS Cadastral Ground Resurvey",
            storage_uri="s3://bhusetu-cadastre/blr/cadastre_v2_1.geojson",
        )
        session.add_all([ds_sat_2024, ds_lidar_2025, ds_drone_2026, ds_cadastre])
        await session.flush()

        # ---------------------------------------------------------------------
        # 4. PARCELS
        # ---------------------------------------------------------------------
        print("4. Seeding Cadastral Parcels...")
        # Showcase parcel P-102: [77.5720, 12.9980] to [77.5724, 13.0002] (~520 m²)
        p102_poly = shapely.geometry.Polygon([
            (77.57200, 12.99800),
            (77.57235, 12.99800),
            (77.57235, 13.00020),
            (77.57200, 13.00020),
            (77.57200, 12.99800),
        ])
        parcel_p102 = Parcel(
            id=PARCEL_P102_ID,
            city_id=CITY_BLR_ID,
            region_id=REGION_MALL_ID,
            ulpin_2d="KA-BLR-2026-P102",
            survey_number="102/3B",
            recorded_area_sqm=Decimal("520.00"),
            computed_area_sqm=Decimal("520.00"),
            land_use="COMMERCIAL_MIXED",
            geom_2d=from_shape(p102_poly, srid=4326),
            elevation_base=Decimal("920.00"),
        )

        # Compliant residential parcel P-101 (south of P-102)
        p101_poly = shapely.geometry.Polygon([
            (77.57200, 12.99600),
            (77.57235, 12.99600),
            (77.57235, 12.99780),
            (77.57200, 12.99780),
            (77.57200, 12.99600),
        ])
        parcel_p101 = Parcel(
            id=PARCEL_P101_ID,
            city_id=CITY_BLR_ID,
            region_id=REGION_MALL_ID,
            ulpin_2d="KA-BLR-2026-P101",
            survey_number="101/2A",
            recorded_area_sqm=Decimal("420.00"),
            computed_area_sqm=Decimal("420.00"),
            land_use="RESIDENTIAL",
            geom_2d=from_shape(p101_poly, srid=4326),
            elevation_base=Decimal("919.50"),
        )

        # Incomplete/unverified parcel P-103 (north of P-102)
        p103_poly = shapely.geometry.Polygon([
            (77.57200, 13.00040),
            (77.57235, 13.00040),
            (77.57235, 13.00200),
            (77.57200, 13.00200),
            (77.57200, 13.00040),
        ])
        parcel_p103 = Parcel(
            id=PARCEL_P103_ID,
            city_id=CITY_BLR_ID,
            region_id=REGION_MALL_ID,
            ulpin_2d="KA-BLR-2026-P103",
            survey_number="103/1",
            recorded_area_sqm=Decimal("380.00"),
            computed_area_sqm=Decimal("380.00"),
            land_use="COMMERCIAL",
            geom_2d=from_shape(p103_poly, srid=4326),
            elevation_base=Decimal("920.80"),
        )
        session.add_all([parcel_p102, parcel_p101, parcel_p103])
        await session.flush()

        # ---------------------------------------------------------------------
        # 5. 3D BUILDINGS
        # ---------------------------------------------------------------------
        print("5. Seeding 3D Buildings (with Controlled Spatial Discrepancy on B-102)...")
        # Building B-102 Footprint:
        # Cadastral Parcel eastern boundary is at longitude 77.57235.
        # Building eastern facade extends to 77.57237 (+0.00002 deg =~ 2.2m setback encroachment / overlap!)
        b102_footprint = shapely.geometry.Polygon([
            (77.57205, 12.99830),
            (77.57237, 12.99830),  # Extends past parcel eastern boundary 77.57235!
            (77.57237, 12.99990),  # Extends past parcel eastern boundary 77.57235!
            (77.57205, 12.99990),
            (77.57205, 12.99830),
        ])
        building_b102 = Building(
            id=BUILDING_B102_ID,
            parcel_id=PARCEL_P102_ID,
            building_code="BLD-KA-BLR-102",
            name="Aura Horizon Commercial Complex",
            building_type="COMMERCIAL",
            footprint_geom=from_shape(b102_footprint, srid=4326),
            ground_elevation=Decimal("920.50"),
            building_height=Decimal("14.50"),
            detected_floors=4,       # Detected: 4 floors (Ground + 3)
            sanctioned_floors=3,     # Sanctioned: 3 floors -> Triggers floor deviation!
            status_3d="EXTRUDED_3D",
            height_source="LIDAR_POINT_CLOUD",
            extraction_method="DRONE_PHOTOGRAMMETRY_LIDAR_FUSION",
            confidence_score=Decimal("0.940"),
            processing_version="pipeline_v2.4",
            metadata_json={
                "sanction_reference": "BBMP/TP/2022/COMM-8891",
                "construction_year": 2024,
                "structure_type": "RCC_FRAMED",
                "roof_type": "FLAT_ACCESSIBLE",
            }
        )

        # Compliant Building B-101 (fully inside Parcel P-101)
        b101_footprint = shapely.geometry.Polygon([
            (77.57205, 12.99630),
            (77.57230, 12.99630),
            (77.57230, 12.99750),
            (77.57205, 12.99750),
            (77.57205, 12.99630),
        ])
        building_b101 = Building(
            id=BUILDING_B101_ID,
            parcel_id=PARCEL_P101_ID,
            building_code="BLD-KA-BLR-101",
            name="Malleshwaram Residency",
            building_type="RESIDENTIAL",
            footprint_geom=from_shape(b101_footprint, srid=4326),
            ground_elevation=Decimal("919.80"),
            building_height=Decimal("10.50"),
            detected_floors=3,
            sanctioned_floors=3,
            status_3d="EXTRUDED_3D",
            height_source="DSM_DEM_DIFFERENCE",
            extraction_method="STEREO_SATELLITE_PHOTOGRAMMETRY",
            confidence_score=Decimal("0.965"),
            processing_version="pipeline_v2.4",
        )

        # Incomplete Building B-103
        b103_footprint = shapely.geometry.Polygon([
            (77.57205, 13.00060),
            (77.57230, 13.00060),
            (77.57230, 13.00160),
            (77.57205, 13.00160),
            (77.57205, 13.00060),
        ])
        building_b103 = Building(
            id=BUILDING_B103_ID,
            parcel_id=PARCEL_P103_ID,
            building_code="BLD-KA-BLR-103",
            name="Green Valley Arcade",
            building_type="COMMERCIAL",
            footprint_geom=from_shape(b103_footprint, srid=4326),
            ground_elevation=Decimal("921.00"),
            building_height=Decimal("7.50"),
            detected_floors=2,
            sanctioned_floors=2,
            status_3d="FOOTPRINT_ONLY",
            confidence_score=Decimal("0.710"),
        )
        session.add_all([building_b102, building_b101, building_b103])
        await session.flush()

        # ---------------------------------------------------------------------
        # 6. VERTICAL FLOORS (Parcel -> Building -> Floors)
        # ---------------------------------------------------------------------
        print("6. Seeding Vertical Floors (Ground + 3 Floors on B-102)...")
        floors_b102 = [
            Floor(
                id=FLOOR_P102_F0_ID,
                building_id=BUILDING_B102_ID,
                floor_number=0,
                floor_code="FL-00",
                floor_label="Ground Floor — Commercial Banking Concourse",
                base_elevation=Decimal("920.50"),
                ceiling_elevation=Decimal("924.00"),
                floor_height=Decimal("3.50"),
                floor_area_sqm=Decimal("240.00"),
                status_3d="AVAILABLE",
                confidence_score=Decimal("0.960"),
            ),
            Floor(
                id=FLOOR_P102_F1_ID,
                building_id=BUILDING_B102_ID,
                floor_number=1,
                floor_code="FL-01",
                floor_label="First Floor — Healthcare Diagnostics",
                base_elevation=Decimal("924.00"),
                ceiling_elevation=Decimal("927.50"),
                floor_height=Decimal("3.50"),
                floor_area_sqm=Decimal("240.00"),
                status_3d="AVAILABLE",
                confidence_score=Decimal("0.950"),
            ),
            Floor(
                id=FLOOR_P102_F2_ID,
                building_id=BUILDING_B102_ID,
                floor_number=2,
                floor_code="FL-02",
                floor_label="Second Floor — Tech Workspace",
                base_elevation=Decimal("927.50"),
                ceiling_elevation=Decimal("931.00"),
                floor_height=Decimal("3.50"),
                floor_area_sqm=Decimal("240.00"),
                status_3d="AVAILABLE",
                confidence_score=Decimal("0.940"),
            ),
            Floor(
                id=FLOOR_P102_F3_ID,
                building_id=BUILDING_B102_ID,
                floor_number=3,
                floor_code="FL-03",
                floor_label="Third Floor — Corporate Suites (Exceeds Sanctioned Limit)",
                base_elevation=Decimal("931.00"),
                ceiling_elevation=Decimal("935.00"),
                floor_height=Decimal("4.00"),
                floor_area_sqm=Decimal("240.00"),
                status_3d="AVAILABLE",
                confidence_score=Decimal("0.920"),
            ),
        ]
        for f in floors_b102:
            session.add(f)
        await session.flush()

        # ---------------------------------------------------------------------
        # 7. VERTICAL UNITS (Floor -> Units with 3D ULPIN)
        # ---------------------------------------------------------------------
        print("7. Seeding Vertical Units with 3D ULPIN Identifiers...")
        units_b102 = [
            Unit(
                id=UNIT_P102_U01_ID,
                floor_id=FLOOR_P102_F0_ID,
                building_id=BUILDING_B102_ID,
                parcel_id=PARCEL_P102_ID,
                ulpin_3d="KA-BLR-2026-P102-B1-F0-U01",
                unit_number="G-01",
                unit_label="Retail Banking Concourse",
                unit_type="COMMERCIAL_RETAIL",
                carpet_area_sqm=Decimal("180.00"),
                spatial_centroid_z=from_shape(shapely.geometry.Point(77.57220, 12.99910, 922.25), srid=4326),
                status_3d="AVAILABLE",
                verification_status="PENDING",
                metadata_json={"built_up_area_sqm": 220.0, "base_elevation": 920.50, "ceiling_elevation": 924.00},
            ),
            Unit(
                id=UNIT_P102_U02_ID,
                floor_id=FLOOR_P102_F1_ID,
                building_id=BUILDING_B102_ID,
                parcel_id=PARCEL_P102_ID,
                ulpin_3d="KA-BLR-2026-P102-B1-F1-U02",
                unit_number="101",
                unit_label="Medical Diagnostics Center",
                unit_type="COMMERCIAL_OFFICE",
                carpet_area_sqm=Decimal("195.00"),
                spatial_centroid_z=from_shape(shapely.geometry.Point(77.57220, 12.99910, 925.75), srid=4326),
                status_3d="AVAILABLE",
                verification_status="PENDING",
                metadata_json={"built_up_area_sqm": 230.0, "base_elevation": 924.00, "ceiling_elevation": 927.50},
            ),
            Unit(
                id=UNIT_P102_U03_ID,
                floor_id=FLOOR_P102_F2_ID,
                building_id=BUILDING_B102_ID,
                parcel_id=PARCEL_P102_ID,
                ulpin_3d="KA-BLR-2026-P102-B1-F2-U03",
                unit_number="201",
                unit_label="Tech Innovation Workspace",
                unit_type="IT_OFFICE",
                carpet_area_sqm=Decimal("205.00"),
                spatial_centroid_z=from_shape(shapely.geometry.Point(77.57220, 12.99910, 929.25), srid=4326),
                status_3d="AVAILABLE",
                verification_status="PENDING",
                metadata_json={"built_up_area_sqm": 235.0, "base_elevation": 927.50, "ceiling_elevation": 931.00},
            ),
            Unit(
                id=UNIT_P102_U04_ID,
                floor_id=FLOOR_P102_F3_ID,
                building_id=BUILDING_B102_ID,
                parcel_id=PARCEL_P102_ID,
                ulpin_3d="KA-BLR-2026-P102-B1-F3-U04",
                unit_number="301",
                unit_label="Corporate Conference Suites",
                unit_type="COMMERCIAL_OFFICE",
                carpet_area_sqm=Decimal("190.00"),
                spatial_centroid_z=from_shape(shapely.geometry.Point(77.57220, 12.99910, 933.00), srid=4326),
                status_3d="AVAILABLE",
                verification_status="PENDING",
                metadata_json={"built_up_area_sqm": 225.0, "base_elevation": 931.00, "ceiling_elevation": 935.00},
            ),
        ]
        for u in units_b102:
            session.add(u)

        # Property Identities (ULPIN-Oriented Prototypes)
        prop_id_102 = PropertyIdentity(
            parcel_id=PARCEL_P102_ID,
            building_id=BUILDING_B102_ID,
            ulpin_oriented_id="PROP-KA-BLR-2026-P102",
            identity_version=1,
            status="PROTOTYPE",
            metadata_json={"display_name": "Aura Horizon Commercial Complex", "survey_number": "102/3B", "hierarchy_type": "PARCEL_BUILDING_FLOOR_UNIT"},
        )
        prop_id_101 = PropertyIdentity(
            parcel_id=PARCEL_P101_ID,
            building_id=BUILDING_B101_ID,
            ulpin_oriented_id="PROP-KA-BLR-2026-P101",
            identity_version=1,
            status="PROTOTYPE",
            metadata_json={"display_name": "Malleshwaram Residency", "survey_number": "101/2A", "hierarchy_type": "PARCEL_BUILDING"},
        )
        session.add_all([prop_id_102, prop_id_101])

        # ---------------------------------------------------------------------
        # 8. MUNICIPAL INFRASTRUCTURE & RELATIONSHIPS
        # ---------------------------------------------------------------------
        print("8. Seeding Municipal Infrastructure (Road, Drainage, Water)...")
        # 8th Main Arterial Road (Surface LineString directly west of the parcels)
        road_line = shapely.geometry.LineString([
            (77.57185, 12.99500, 920.0),
            (77.57185, 13.00300, 920.0),
        ])
        infra_road = Infrastructure(
            id=INFRA_ROAD_ID,
            city_id=CITY_BLR_ID,
            name="8th Main Arterial Corridor",
            utility_category="ROAD",
            is_subsurface=False,
            depth_meters=Decimal("0.0"),
            evidence_source_type="AUTHORITATIVE",
            geom_spatial=from_shape(road_line, srid=4326),
            observation_date=date(2026, 1, 15),
            valid_from=date(2020, 1, 1),
            network_connectivity={"class": "PRIMARY_ARTERIAL", "lanes": 4, "surface": "ASPHALT"},
        )

        # Storm Water Drain SWD-MALL-04 (Covered subsurface drain between road and parcel)
        drain_line = shapely.geometry.LineString([
            (77.57192, 12.99500, 918.2),
            (77.57192, 13.00300, 918.2),
        ])
        infra_drain = Infrastructure(
            id=INFRA_DRAIN_ID,
            city_id=CITY_BLR_ID,
            name="SWD-MALL-04 (Covered Storm Drainage)",
            utility_category="DRAINAGE",
            is_subsurface=True,
            depth_meters=Decimal("1.80"),
            evidence_source_type="AUTHORITATIVE",
            geom_spatial=from_shape(drain_line, srid=4326),
            observation_date=date(2026, 1, 15),
            valid_from=date(2022, 6, 1),
            network_connectivity={"type": "STORM_WATER", "box_culvert_width_m": 2.5},
        )

        # Potable Water Feeder BWSSB-DIST-24 (Subsurface pipeline)
        water_line = shapely.geometry.LineString([
            (77.57195, 12.99500, 918.8),
            (77.57195, 13.00300, 918.8),
        ])
        infra_water = Infrastructure(
            id=INFRA_WATER_ID,
            city_id=CITY_BLR_ID,
            name="BWSSB-DIST-24 (Municipal Potable Feeder)",
            utility_category="WATER",
            is_subsurface=True,
            depth_meters=Decimal("1.20"),
            evidence_source_type="AUTHORITATIVE",
            geom_spatial=from_shape(water_line, srid=4326),
            observation_date=date(2026, 1, 15),
            valid_from=date(2018, 4, 1),
            network_connectivity={"diameter_mm": 350, "material": "DUCTILE_IRON"},
        )
        session.add_all([infra_road, infra_drain, infra_water])

        # Parcel-Infrastructure Associations
        p_infra_road = ParcelInfrastructure(
            parcel_id=PARCEL_P102_ID,
            infrastructure_id=INFRA_ROAD_ID,
            intersection_type="ADJACENT_ROAD",
        )
        p_infra_drain = ParcelInfrastructure(
            parcel_id=PARCEL_P102_ID,
            infrastructure_id=INFRA_DRAIN_ID,
            intersection_type="PARALLEL_UTILITY_DRAIN",
        )
        session.add_all([p_infra_road, p_infra_drain])

        # ---------------------------------------------------------------------
        # 9. 4D PROPERTY HISTORY & CHANGE EVENTS (Temporal Intelligence)
        # ---------------------------------------------------------------------
        print("9. Seeding 4D Temporal History (2024 -> 2025 -> 2026 Epochs)...")
        # 2024 Footprint: 2 floors, ~180 m²
        b102_fp_2024 = shapely.geometry.Polygon([
            (77.57205, 12.99830), (77.57228, 12.99830), (77.57228, 12.99960), (77.57205, 12.99960), (77.57205, 12.99830)
        ])
        v_2024 = PropertyStateVersion(
            id=VERSION_2024_ID,
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            version_number=1,
            observed_at=date(2024, 2, 15),
            valid_from=date(2024, 2, 15),
            valid_to=date(2025, 3, 10),
            observed_interval="2024-Q1",
            source_dataset_id=DATASET_SAT_2024_ID,
            source_name="Cartosat-3 Optical Satellite Survey 2024",
            geom_spatial=from_shape(b102_fp_2024, srid=4326),
            attributes_snapshot={
                "building_height": 7.5,
                "detected_floors": 2,
                "sanctioned_floors": 3,
                "footprint_area_sqm": 180.0,
                "status": "COMPLIANT_WITHIN_PARCEL",
            },
            confidence_score=Decimal("0.880"),
            verification_status="CONFIRMED",
        )

        # 2025 Footprint: 2 floors, ~185 m²
        b102_fp_2025 = shapely.geometry.Polygon([
            (77.57205, 12.99830), (77.57229, 12.99830), (77.57229, 12.99965), (77.57205, 12.99965), (77.57205, 12.99830)
        ])
        v_2025 = PropertyStateVersion(
            id=VERSION_2025_ID,
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            version_number=2,
            observed_at=date(2025, 3, 10),
            valid_from=date(2025, 3, 10),
            valid_to=date(2026, 1, 20),
            observed_interval="2025-Q1",
            source_dataset_id=DATASET_LIDAR_2025_ID,
            source_name="Leica Airborne LiDAR Survey 2025",
            geom_spatial=from_shape(b102_fp_2025, srid=4326),
            attributes_snapshot={
                "building_height": 7.5,
                "detected_floors": 2,
                "sanctioned_floors": 3,
                "footprint_area_sqm": 185.0,
                "status": "COMPLIANT_WITHIN_PARCEL",
            },
            confidence_score=Decimal("0.930"),
            verification_status="CONFIRMED",
        )

        # 2026 Footprint: 4 floors, ~240 m² (expansion eastward)
        v_2026 = PropertyStateVersion(
            id=VERSION_2026_ID,
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            version_number=3,
            observed_at=date(2026, 1, 20),
            valid_from=date(2026, 1, 20),
            valid_to=None,
            observed_interval="2026-Q1",
            source_dataset_id=DATASET_DRONE_2026_ID,
            source_name="DJI M300 Drone Photogrammetry 2026",
            geom_spatial=from_shape(b102_footprint, srid=4326),
            attributes_snapshot={
                "building_height": 14.5,
                "detected_floors": 4,
                "sanctioned_floors": 3,
                "footprint_area_sqm": 240.0,
                "status": "DISCREPANCY_DETECTED",
            },
            confidence_score=Decimal("0.940"),
            verification_status="UNDER_REVIEW",
        )
        session.add_all([v_2024, v_2025, v_2026])

        # Deterministic Change Event
        change_exp = ChangeEvent(
            id=CHANGE_EVENT_ID,
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            change_type="BUILDING_EXPANDED",
            previous_version_id=VERSION_2024_ID,
            new_version_id=VERSION_2026_ID,
            observed_at=date(2026, 1, 20),
            measured_change={
                "area_diff_sqm": 60.0,
                "percentage_increase": 33.33,
                "floor_diff": 2,
                "height_diff_m": 7.0,
                "expansion_direction": "EASTWARD",
            },
            change_geom=from_shape(b102_footprint, srid=4326),
            description="Building footprint expanded by +60.0 m² (33.3%) eastward and added 2 vertical levels between 2024 and 2026 observation epochs.",
            evidence_reference={
                "baseline_source": "Cartosat-3 2024 Optical Imagery",
                "inspection_source": "Drone Photogrammetry 2026 Reality Mesh",
                "method": "BhuSetu 4D Temporal Difference Engine",
            },
            confidence_score=Decimal("0.940"),
            verification_status="UNDER_REVIEW",
            status="DETECTED",
            analysis_version="temporal_engine_v1",
        )
        session.add(change_exp)

        # ---------------------------------------------------------------------
        # 10. SPATIAL DISCREPANCIES (Controlled Findings)
        # ---------------------------------------------------------------------
        print("10. Seeding Spatial Discrepancies (Boundary Overlap & Floor Count)...")
        conflict_setback = Conflict(
            id=CONFLICT_SETBACK_ID,
            conflict_type="PARCEL_BOUNDARY_OVERLAP",
            severity="HIGH",
            rule_id="RULE-SETBACK-01",
            rule_name="Cadastral Boundary Setback Adherence",
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            related_entity_type="PARCEL",
            related_entity_id=PARCEL_P102_ID,
            parcel_id=PARCEL_P102_ID,
            building_id=BUILDING_B102_ID,
            measured_value=Decimal("14.200"),
            threshold_value=Decimal("0.500"),
            measured_unit="m²",
            deviation_value=Decimal("13.70"),
            explanation="Building eastern facade footprint extends approximately 1.8m beyond the registered cadastral boundary polygon, resulting in a 14.20 m² spatial deviation.",
            discrepancy_details={
                "overlap_area_sqm": 14.2,
                "max_encroachment_distance_m": 1.8,
                "affected_facade": "EAST",
            },
            evidence_reference={
                "primary_evidence_dataset": "2026 Drone Photogrammetry & 3D Reality Mesh",
                "cadastral_dataset": "Bengaluru Digital Cadastral Boundary Layer v2.1",
            },
            confidence_score=Decimal("0.940"),
            analysis_version="spatial_rules_v1",
            conflict_geom=from_shape(b102_footprint, srid=4326),
            status="OPEN",
            verification_status="UNDER_REVIEW",
            assigned_reviewer_id=USER_OFFICER_ID,
        )

        conflict_height = Conflict(
            id=CONFLICT_HEIGHT_ID,
            conflict_type="VERTICAL_HEIGHT_EXCEEDED",
            severity="MEDIUM",
            rule_id="RULE-HEIGHT-01",
            rule_name="Sanctioned Vertical Floor Limit",
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            related_entity_type="PARCEL",
            related_entity_id=PARCEL_P102_ID,
            parcel_id=PARCEL_P102_ID,
            building_id=BUILDING_B102_ID,
            measured_value=Decimal("4.000"),
            threshold_value=Decimal("3.000"),
            measured_unit="floors",
            deviation_value=Decimal("1.00"),
            explanation="Vertical level analysis detected 4 physical floors (14.5m height) exceeding the sanctioned floor limit of 3 floors.",
            discrepancy_details={
                "detected_floors": 4,
                "sanctioned_floors": 3,
                "unauthorized_floor_code": "FL-03",
            },
            evidence_reference={
                "source": "Airborne LiDAR + Drone Photogrammetry Fusion",
            },
            confidence_score=Decimal("0.920"),
            analysis_version="spatial_rules_v1",
            status="OPEN",
            verification_status="UNREVIEWED",
        )
        session.add_all([conflict_setback, conflict_height])

        # ---------------------------------------------------------------------
        # 11. EVIDENCE & PROVENANCE
        # ---------------------------------------------------------------------
        print("11. Seeding Traceable Evidence & Lineage Records...")
        ev_drone = Evidence(
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            dataset_id=DATASET_DRONE_2026_ID,
            source_classification="AUTHORITATIVE",
            source_type="DRONE_PHOTOGRAMMETRY",
            confidence_score=Decimal("0.9400"),
            status="AVAILABLE",
            processing_method="Structure-from-Motion (SfM) + Multi-View Stereo 3D Mesh",
            model_version="mesh_v2.4",
            notes="3D Reality Mesh inspection confirms 4 physical vertical stories and eastern boundary extension.",
            supporting_factors=["RTK GPS positioning accuracy <= 2cm", "Ground sampling distance (GSD) 1.2 cm/px"],
            limiting_factors=["Overcast weather during capture; lighting variance compensated by radiometric normalization"],
            evidence_metadata={"survey_flight_id": "UAV-2026-BLR-014", "altitude_m": 75.0},
        )
        ev_cadastre = Evidence(
            entity_type="PARCEL",
            entity_id=PARCEL_P102_ID,
            dataset_id=DATASET_CADASTRE_ID,
            source_classification="AUTHORITATIVE",
            source_type="CADASTRAL_SURVEY",
            confidence_score=Decimal("0.9600"),
            status="AVAILABLE",
            processing_method="DGPS Ground Survey Cadastral Vectorization",
            notes="Official land boundary coordinate sheet approved under Survey No. 102/3B.",
            supporting_factors=["Boundary stones physically verified at corners A, B, C, D"],
            limiting_factors=[],
            evidence_metadata={"survey_sheet": "BLR-NORTH-MALL-P102"},
        )
        session.add_all([ev_drone, ev_cadastre])

        # ---------------------------------------------------------------------
        # 12. HUMAN VERIFICATION & CRYPTOGRAPHIC AUDIT LOG
        # ---------------------------------------------------------------------
        print("12. Seeding Human Verification & Hash-Chained Audit Trail...")
        v_rec = VerificationRecord(
            id=VERIFICATION_REC_ID,
            conflict_id=CONFLICT_SETBACK_ID,
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            officer_id=USER_OFFICER_ID,
            action="ASSIGN_REVIEW",
            decision="UNDER_INVESTIGATION",
            justification="Review assigned to Cadastral Administration officer Kavita Sharma. Dispatched field surveyor for physical verification of eastern boundary stones.",
            previous_status="UNREVIEWED",
            new_status="UNDER_REVIEW",
            evidence_references=[
                {"dataset": "2026 Drone Photogrammetry", "confidence": 0.94},
                {"dataset": "Cadastral Survey Sheet 2020", "confidence": 0.96},
            ],
            confidence_at_review=Decimal("0.940"),
            notes="Field team assigned on 2026-02-01.",
        )
        session.add(v_rec)

        # Cryptographic Audit Hash Chain
        # Genesis Block
        genesis_data = json.dumps({"event": "GENESIS_LEDGER", "platform": "BhuSetu 3D", "version": "1.0"}, sort_keys=True)
        genesis_hash = calc_sha256(genesis_data)
        log1 = AuditLog(
            user_id=USER_ADMIN_ID,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id=CITY_BLR_ID,
            previous_state=None,
            new_state={"event": "GENESIS_LEDGER", "platform": "BhuSetu 3D"},
            ip_address="127.0.0.1",
            prev_hash="0000000000000000000000000000000000000000000000000000000000000000",
            current_hash=genesis_hash,
        )
        session.add(log1)

        # Block 2: Conflict Detection Event
        block2_data = json.dumps({
            "prev_hash": genesis_hash,
            "action": "CONFLICT_DETECTED",
            "entity": f"BUILDING:{BUILDING_B102_ID}",
            "conflict_id": str(CONFLICT_SETBACK_ID),
        }, sort_keys=True)
        block2_hash = calc_sha256(block2_data)
        log2 = AuditLog(
            user_id=USER_OFFICER_ID,
            action="CONFLICT_DETECTED",
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            previous_state={"status": "UNREVIEWED"},
            new_state={"status": "OPEN", "discrepancy": "PARCEL_BOUNDARY_OVERLAP"},
            ip_address="10.0.4.15",
            prev_hash=genesis_hash,
            current_hash=block2_hash,
        )
        session.add(log2)

        # Block 3: Verification Assignment
        block3_data = json.dumps({
            "prev_hash": block2_hash,
            "action": "ASSIGN_REVIEW",
            "reviewer": str(USER_OFFICER_ID),
            "verification_id": str(VERIFICATION_REC_ID),
        }, sort_keys=True)
        block3_hash = calc_sha256(block3_data)
        log3 = AuditLog(
            user_id=USER_OFFICER_ID,
            action="ASSIGN_REVIEW",
            entity_type="BUILDING",
            entity_id=BUILDING_B102_ID,
            previous_state={"verification_status": "UNREVIEWED"},
            new_state={"verification_status": "UNDER_REVIEW", "assigned_to": "Kavita Sharma"},
            ip_address="10.0.4.15",
            prev_hash=block2_hash,
            current_hash=block3_hash,
        )
        session.add(log3)

        # ---------------------------------------------------------------------
        # 13. DATA QUALITY INTELLIGENCE & SCORE SNAPSHOTS
        # ---------------------------------------------------------------------
        print("13. Seeding Explainable Quality Snapshots (84.5% vs 96.0% vs 62.0%)...")
        snap_p102 = QualityScoreSnapshot(
            entity_type="PARCEL",
            entity_id=PARCEL_P102_ID,
            overall_score=Decimal("84.50"),
            component_scores={
                "completeness": 92.0,
                "spatial_validity": 78.0,  # Reduced due to boundary overlap discrepancy
                "attribute_consistency": 95.0,
                "provenance_coverage": 88.0,
                "evidence_coverage": 90.0,
                "verification_coverage": 70.0,  # Under review
                "temporal_coverage": 85.0,
            },
            weights_used={
                "completeness": 0.20,
                "spatial_validity": 0.20,
                "attribute_consistency": 0.15,
                "provenance_coverage": 0.15,
                "evidence_coverage": 0.15,
                "verification_coverage": 0.10,
                "temporal_coverage": 0.05,
            },
            rule_results=[
                {"rule": "SETBACK_COMPLIANCE", "status": "FAIL", "severity": "HIGH"},
                {"rule": "VERTICAL_HEIGHT_LIMIT", "status": "FAIL", "severity": "MEDIUM"},
                {"rule": "GEOMETRY_VALIDITY", "status": "PASS"},
                {"rule": "COMPLETENESS", "status": "PASS"},
            ],
            missing_fields=[],
            calculated_by=USER_ADMIN_ID,
        )
        snap_p101 = QualityScoreSnapshot(
            entity_type="PARCEL",
            entity_id=PARCEL_P101_ID,
            overall_score=Decimal("96.00"),
            component_scores={
                "completeness": 98.0,
                "spatial_validity": 100.0,
                "attribute_consistency": 96.0,
                "provenance_coverage": 94.0,
                "evidence_coverage": 95.0,
                "verification_coverage": 95.0,
                "temporal_coverage": 90.0,
            },
            weights_used={
                "completeness": 0.20,
                "spatial_validity": 0.20,
                "attribute_consistency": 0.15,
                "provenance_coverage": 0.15,
                "evidence_coverage": 0.15,
                "verification_coverage": 0.10,
                "temporal_coverage": 0.05,
            },
            rule_results=[
                {"rule": "SETBACK_COMPLIANCE", "status": "PASS"},
                {"rule": "VERTICAL_HEIGHT_LIMIT", "status": "PASS"},
                {"rule": "GEOMETRY_VALIDITY", "status": "PASS"},
                {"rule": "COMPLETENESS", "status": "PASS"},
            ],
            missing_fields=[],
            calculated_by=USER_ADMIN_ID,
        )
        session.add_all([snap_p102, snap_p101])

        q_issue = QualityIssue(
            entity_type="PARCEL",
            entity_id=PARCEL_P102_ID,
            category="SPATIAL_VALIDITY",
            severity="HIGH",
            rule_code="RULE-SETBACK-01",
            message="Contained building B-102 eastern footprint boundary extends 14.20 m² beyond parcel perimeter.",
            discrepancy_details={"overlap_sqm": 14.2, "conflict_id": str(CONFLICT_SETBACK_ID)},
            evidence_reference={"source": "2026 Reality Mesh"},
            status="OPEN",
            action_url=f"/conflicts/{CONFLICT_SETBACK_ID}",
        )
        session.add(q_issue)

        # Commit everything to Supabase
        await session.commit()
        print("=" * 70)
        print("SUCCESS! BHUSETU-DEMO-01 DATASET SEEDED TO SUPABASE SUCCESSFULLY!")
        print("=" * 70)


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_demo_database())
