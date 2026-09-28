"""
BhuSetu 3D File Security & Format Validator
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import os
import hashlib
import zipfile
from pathlib import Path
from typing import Tuple, List, Optional
from fastapi import HTTPException, status
from app.core.logging import logger

MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB


class FileValidator:
    """Security verification, hash calculation, and format inspection for uploaded spatial data."""

    SUPPORTED_EXTENSIONS = {
        ".geojson": "GEOJSON",
        ".json": "GEOJSON",
        ".shp": "SHAPEFILE",
        ".gpkg": "GEOPACKAGE",
        ".csv": "CSV",
        ".tif": "GEOTIFF",
        ".tiff": "GEOTIFF",
        ".zip": "ZIP_ARCHIVE",
    }

    @staticmethod
    def calculate_sha256(file_path: Path) -> str:
        """Computes cryptographic SHA-256 hash in 64KB blocks."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @classmethod
    def detect_format(cls, filename: str) -> str:
        """Identifies dataset format by extension with security validation."""
        lower_name = filename.lower()
        for ext, fmt in cls.SUPPORTED_EXTENSIONS.items():
            if lower_name.endswith(ext):
                return fmt
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format for '{filename}'. Supported formats: GeoJSON, Shapefile (.shp/.zip), GeoPackage (.gpkg), CSV, GeoTIFF (.tif/.tiff)."
        )

    @classmethod
    def validate_file_security(cls, file_path: Path, filename: str) -> Tuple[int, str, str]:
        """
        Validates file size, path containment, and returns (size_bytes, sha256_hash, format).
        """
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uploaded file not found on staging disk."
            )

        file_size = file_path.stat().st_size
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        if file_size > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum permissible upload limit of 100MB ({file_size / (1024*1024):.1f}MB)."
            )

        # Anti-traversal verification
        safe_filename = Path(filename).name
        if ".." in filename or "/" in filename or "\\" in filename:
            logger.warning(f"Path traversal character detected in filename: '{filename}', sanitized to '{safe_filename}'")

        file_hash = cls.calculate_sha256(file_path)
        detected_format = cls.detect_format(safe_filename)

        return file_size, file_hash, detected_format

    @classmethod
    def safe_extract_zip(cls, zip_path: Path, target_dir: Path) -> List[Path]:
        """
        Safely extracts ZIP archive ensuring strict prevention of Zip-Slip path traversal attacks.
        Returns list of extracted file paths.
        """
        target_dir.mkdir(parents=True, exist_ok=True)
        resolved_target = target_dir.resolve()
        extracted_paths: List[Path] = []

        with zipfile.ZipFile(zip_path, "r") as archive:
            for member in archive.infolist():
                # Check for path traversal / Zip Slip
                member_path = target_dir / member.filename
                resolved_member = member_path.resolve()

                try:
                    resolved_member.relative_to(resolved_target)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Security violation: Archive contains malicious path traversal entry '{member.filename}'."
                    )

                archive.extract(member, target_dir)
                extracted_paths.append(resolved_member)

        return extracted_paths
