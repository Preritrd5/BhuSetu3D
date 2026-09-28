"""
BhuSetu 3D Processor Base Architecture
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from shapely.geometry.base import BaseGeometry
from app.schemas.ingestion import FileInspectionResult


@dataclass
class NormalizedFeature:
    """Standardized internal representation of an ingested spatial record."""
    source_id: Optional[str]
    geometry: Optional[BaseGeometry]
    attributes: Dict[str, Any]
    original_geometry_type: Optional[str] = None
    crs: str = "EPSG:4326"


class BaseProcessor(ABC):
    """Abstract interface for dataset format processors."""

    @abstractmethod
    def inspect(self, file_path: Path, filename: str) -> FileInspectionResult:
        """Inspects dataset structure, CRS, bounds, and summary without loading into database."""
        pass

    @abstractmethod
    def parse(
        self,
        file_path: Path,
        manual_crs: Optional[str] = None
    ) -> List[NormalizedFeature]:
        """Parses and normalizes records into standardized NormalizedFeatures in EPSG:4326."""
        pass
