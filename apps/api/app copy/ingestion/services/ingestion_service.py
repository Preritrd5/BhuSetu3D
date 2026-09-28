"""
BhuSetu 3D Ingestion Orchestration Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import os
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime, date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from geoalchemy2.shape import from_shape
from geoalchemy2.elements import WKBElement
import shapely

from app.models.ingestion import IngestionJob
from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.infrastructure import Infrastructure
from app.models.provenance import Dataset, DataSource, Evidence
from app.schemas.ingestion import (
    FileInspectionResult,
    FileUploadResponse,
    JobCreateRequest,
    IngestionQualityReport,
    GeometryQualityReport,
    AttributeQualityReport,
    CrsQualityReport,
    DatabaseQualityReport,
)
from app.ingestion.validators.file_validator import FileValidator
from app.ingestion.validators.crs_validator import CrsValidator, CANONICAL_TARGET_CRS
from app.ingestion.validators.geometry_validator import GeometryValidator
from app.ingestion.processors.vector_processor import VectorProcessor
from app.ingestion.processors.csv_processor import CsvProcessor
from app.ingestion.processors.raster_processor import RasterProcessor
from app.ingestion.processors.base import BaseProcessor, NormalizedFeature
from app.ingestion.services.job_service import JobService
from app.core.logging import logger

UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class IngestionService:
    """Orchestrates end-to-end file staging, inspection, validation, transformation, and PostGIS loading."""

    @classmethod
    def get_processor(cls, fmt: str) -> BaseProcessor:
        """Returns the appropriate processor instance for the dataset format."""
        if fmt in ("GEOJSON", "SHAPEFILE", "GEOPACKAGE", "ZIP_ARCHIVE"):
            return VectorProcessor()
        elif fmt == "CSV":
            return CsvProcessor()
        elif fmt == "GEOTIFF":
            return RasterProcessor()
        raise ValueError(f"No processor implemented for format '{fmt}'.")

    @classmethod
    async def stage_upload(
        cls,
        db: AsyncSession,
        file_bytes: bytes,
        filename: str
    ) -> FileUploadResponse:
        """Saves file to staging area, calculates hash, inspects contents, checks idempotency."""
        file_id = str(uuid.uuid4())
        safe_name = Path(filename).name
        staging_path = UPLOAD_DIR / f"{file_id}_{safe_name}"

        with open(staging_path, "wb") as f:
            f.write(file_bytes)

        file_size, file_hash, detected_fmt = FileValidator.validate_file_security(staging_path, safe_name)

        # Inspect file
        processor = cls.get_processor(detected_fmt)
        inspection = processor.inspect(staging_path, safe_name)

        # Idempotency check: see if identical file hash has already been completed
        existing_job = await JobService.check_duplicate_file(db, file_hash)
        is_duplicate = existing_job is not None

        return FileUploadResponse(
            file_id=file_id,
            file_name=safe_name,
            file_size_bytes=file_size,
            file_hash=file_hash,
            inspection=inspection,
            is_duplicate=is_duplicate,
            existing_job_id=existing_job.id if existing_job else None,
        )

    @classmethod
    async def execute_job(
        cls,
        db: AsyncSession,
        job_id: uuid.UUID,
        staging_path: Path,
        job_in: JobCreateRequest,
        user_id: Optional[uuid.UUID] = None
    ) -> IngestionJob:
        """
        Executes the durable database-backed ingestion state machine:
        CREATED -> VALIDATING -> PROCESSING -> VALIDATED -> NORMALIZING -> LOADING -> COMPLETED / FAILED
        """
        try:
            # -----------------------------------------------------------------
            # Stage 1: VALIDATING (15%)
            # -----------------------------------------------------------------
            await JobService.update_job_stage(
                db, job_id,
                status="VALIDATING",
                stage="VALIDATING_FILE",
                progress_percent=15,
                log_message=f"Validating file integrity and CRS for {staging_path.name}."
            )

            file_size, file_hash, detected_fmt = FileValidator.validate_file_security(staging_path, staging_path.name)
            processor = cls.get_processor(detected_fmt)

            # -----------------------------------------------------------------
            # Stage 2: PROCESSING (35%)
            # -----------------------------------------------------------------
            await JobService.update_job_stage(
                db, job_id,
                status="PROCESSING",
                stage="EXTRACTING_FEATURES",
                progress_percent=35,
                log_message=f"Parsing spatial features using {processor.__class__.__name__}."
            )

            features = processor.parse(staging_path, manual_crs=job_in.manual_crs)
            total_records = len(features)

            # -----------------------------------------------------------------
            # Stage 3: NORMALIZING (60%)
            # -----------------------------------------------------------------
            await JobService.update_job_stage(
                db, job_id,
                status="NORMALIZING",
                stage="NORMALIZING_GEOMETRIES",
                progress_percent=60,
                records_total=total_records,
                log_message=f"Normalizing geometries and attributes for {total_records} records."
            )

            expected_category = "POLYGON"
            if job_in.dataset_type == "INFRASTRUCTURE":
                expected_category = "LINE"
            elif job_in.dataset_type == "RASTER":
                expected_category = "POLYGON"

            accepted_features: List[Tuple[NormalizedFeature, Any]] = []
            rejection_details: List[Dict[str, Any]] = []

            geom_valid_cnt = 0
            geom_invalid_cnt = 0
            geom_repaired_cnt = 0
            geom_empty_cnt = 0

            for idx, feat in enumerate(features):
                if feat.geometry is None:
                    geom_empty_cnt += 1
                    rejection_details.append({
                        "source_id": feat.source_id or str(idx + 1),
                        "reason": "EMPTY_GEOMETRY"
                    })
                    continue

                processed_geom, geom_status, reason = GeometryValidator.validate_and_repair(
                    feat.geometry,
                    expected_category=expected_category
                )

                if geom_status == "VALID":
                    geom_valid_cnt += 1
                    accepted_features.append((feat, processed_geom))
                elif geom_status == "REPAIRED":
                    geom_repaired_cnt += 1
                    accepted_features.append((feat, processed_geom))
                else:
                    geom_invalid_cnt += 1
                    rejection_details.append({
                        "source_id": feat.source_id or str(idx + 1),
                        "reason": reason or "INVALID_GEOMETRY"
                    })

            accepted_cnt = len(accepted_features)
            rejected_cnt = len(rejection_details)

            # -----------------------------------------------------------------
            # Stage 4: LOADING (85%)
            # -----------------------------------------------------------------
            inserted_cnt = 0
            if not job_in.validate_only and accepted_features:
                await JobService.update_job_stage(
                    db, job_id,
                    status="LOADING",
                    stage="PERSISTING_TO_POSTGIS",
                    progress_percent=85,
                    records_accepted=accepted_cnt,
                    records_rejected=rejected_cnt,
                    log_message=f"Persisting {accepted_cnt} canonical records to PostGIS tables."
                )

                # Resolve default city and region if not provided
                target_city_id = job_in.city_id
                target_region_id = job_in.region_id

                if not target_city_id:
                    res_c = await db.execute(select(City).limit(1))
                    first_city = res_c.scalar_one_or_none()
                    if first_city:
                        target_city_id = first_city.id

                if not target_region_id and target_city_id:
                    res_r = await db.execute(select(Region).where(Region.city_id == target_city_id).limit(1))
                    first_reg = res_r.scalar_one_or_none()
                    if first_reg:
                        target_region_id = first_reg.id

                # Resolve dataset
                target_dataset_id = job_in.dataset_id
                if not target_dataset_id and target_city_id:
                    # Find or create dataset
                    res_ds = await db.execute(select(Dataset).where(Dataset.city_id == target_city_id).limit(1))
                    first_ds = res_ds.scalar_one_or_none()
                    if first_ds:
                        target_dataset_id = first_ds.id

                # Batch persistence according to dataset type
                if job_in.dataset_type == "PARCEL" and target_city_id and target_region_id:
                    for feat, valid_geom in accepted_features:
                        ulpin_val = feat.attributes.get("ulpin_2d") or feat.attributes.get("ulpin")
                        if not ulpin_val:
                            ulpin_val = f"PARCEL-{uuid.uuid4().hex[:12].upper()}"

                        survey_no = str(feat.attributes.get("survey_number") or feat.attributes.get("survey_no") or feat.source_id or "S-101")
                        land_use = str(feat.attributes.get("land_use") or "RESIDENTIAL")
                        area_val = Decimal(str(feat.attributes.get("recorded_area_sqm") or round(valid_geom.area * 1000000, 2) or 500.00))

                        # Ensure valid Polygon/MultiPolygon
                        postgis_geom = from_shape(valid_geom, srid=4326)

                        parcel = Parcel(
                            id=uuid.uuid4(),
                            city_id=target_city_id,
                            region_id=target_region_id,
                            ulpin_2d=str(ulpin_val)[:20],
                            survey_number=survey_no[:100],
                            recorded_area_sqm=area_val,
                            computed_area_sqm=area_val,
                            land_use=land_use[:50],
                            geom_2d=postgis_geom,
                            elevation_base=Decimal("0.0"),
                        )
                        db.add(parcel)
                        inserted_cnt += 1

                elif job_in.dataset_type == "BUILDING":
                    # Query existing parcel or link to first available
                    res_p = await db.execute(select(Parcel).limit(1))
                    default_parcel = res_p.scalar_one_or_none()

                    if default_parcel:
                        for feat, valid_geom in accepted_features:
                            b_code = str(feat.attributes.get("building_code") or f"BLD-{uuid.uuid4().hex[:8].upper()}")
                            b_name = feat.attributes.get("name") or "Building Structure"
                            b_type = str(feat.attributes.get("building_type") or "RESIDENTIAL")
                            b_height = Decimal(str(feat.attributes.get("building_height") or 10.5))

                            building = Building(
                                id=uuid.uuid4(),
                                parcel_id=default_parcel.id,
                                building_code=b_code[:50],
                                name=str(b_name)[:150],
                                building_type=b_type[:50],
                                footprint_geom=from_shape(valid_geom, srid=4326),
                                ground_elevation=Decimal("0.0"),
                                building_height=b_height,
                                detected_floors=int(feat.attributes.get("detected_floors") or 3),
                                sanctioned_floors=int(feat.attributes.get("sanctioned_floors") or 3),
                            )
                            db.add(building)
                            inserted_cnt += 1

                elif job_in.dataset_type == "REGION" and target_city_id:
                    for feat, valid_geom in accepted_features:
                        reg_name = str(feat.attributes.get("name") or f"Zone {feat.source_id}")
                        reg_code = str(feat.attributes.get("region_code") or f"REG-{uuid.uuid4().hex[:6].upper()}")
                        region = Region(
                            id=uuid.uuid4(),
                            city_id=target_city_id,
                            name=reg_name[:150],
                            region_code=reg_code[:50],
                            region_type=str(feat.attributes.get("region_type") or "WARD")[:50],
                            geom_2d=from_shape(valid_geom, srid=4326),
                        )
                        db.add(region)
                        inserted_cnt += 1

                elif job_in.dataset_type == "INFRASTRUCTURE" and target_city_id:
                    for feat, valid_geom in accepted_features:
                        infra_name = str(feat.attributes.get("name") or f"Corridor {feat.source_id}")
                        infra_type = str(feat.attributes.get("infrastructure_type") or "ROAD")
                        infra = Infrastructure(
                            id=uuid.uuid4(),
                            city_id=target_city_id,
                            name=infra_name[:150],
                            infrastructure_type=infra_type[:50],
                            status="OPERATIONAL",
                            geom_2d=from_shape(valid_geom, srid=4326),
                        )
                        db.add(infra)
                        inserted_cnt += 1

                elif job_in.dataset_type == "RASTER" and target_dataset_id and accepted_features:
                    # Update dataset spatial coverage
                    ds = await db.get(Dataset, target_dataset_id)
                    if ds:
                        _, cov_geom = accepted_features[0]
                        ds.spatial_coverage = from_shape(cov_geom, srid=4326)
                        inserted_cnt = 1

                # Provenance Evidence creation
                if target_dataset_id and inserted_cnt > 0:
                    evidence = Evidence(
                        id=uuid.uuid4(),
                        entity_type=job_in.dataset_type.value,
                        entity_id=job_id,
                        dataset_id=target_dataset_id,
                        source_classification="GIS_INGESTION",
                        confidence_score=Decimal("0.9500"),
                        processing_method=f"Phase4_{processor.__class__.__name__}",
                        notes=f"Auto-generated ingestion provenance record for {inserted_cnt} records.",
                    )
                    db.add(evidence)

                await db.commit()

            # -----------------------------------------------------------------
            # Stage 5: COMPLETED (100%)
            # -----------------------------------------------------------------
            final_status = "COMPLETED"
            final_stage = "VALIDATED" if job_in.validate_only else "PERSISTED"

            quality_rep = IngestionQualityReport(
                total_records=total_records,
                accepted_records=accepted_cnt,
                rejected_records=rejected_cnt,
                warning_records=geom_repaired_cnt,
                geometry=GeometryQualityReport(
                    valid_count=geom_valid_cnt,
                    invalid_count=geom_invalid_cnt,
                    repaired_count=geom_repaired_cnt,
                    empty_count=geom_empty_cnt,
                ),
                attributes=AttributeQualityReport(
                    mapped_columns=list(features[0].attributes.keys()) if features else [],
                ),
                crs=CrsQualityReport(
                    source_crs=features[0].crs if features else "EPSG:4326",
                    target_crs="EPSG:4326",
                    reprojected=True,
                ),
                database=DatabaseQualityReport(
                    inserted_count=inserted_cnt,
                    updated_count=0,
                    skipped_count=rejected_cnt,
                ),
                rejection_details=rejection_details[:50],
            )

            job = await JobService.update_job_stage(
                db, job_id,
                status=final_status,
                stage=final_stage,
                progress_percent=100,
                records_total=total_records,
                records_accepted=accepted_cnt,
                records_rejected=rejected_cnt,
                records_warnings=geom_repaired_cnt,
                quality_report=quality_rep.model_dump(),
                log_message=f"Ingestion completed: {accepted_cnt} accepted, {rejected_cnt} rejected, {inserted_cnt} inserted."
            )
            return job

        except Exception as exc:
            logger.error(f"Ingestion pipeline failed on job {job_id}: {exc}", exc_info=True)
            await db.rollback()
            job = await JobService.update_job_stage(
                db, job_id,
                status="FAILED",
                stage="FAILED",
                progress_percent=100,
                error_message=str(exc),
                log_message=f"Fatal error during execution: {str(exc)}"
            )
            return job
