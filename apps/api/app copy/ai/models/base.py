"""
BhuSetu 3D AI Building Extraction Model Interface
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import numpy as np


class BuildingExtractionModel(ABC):
    """
    Abstract interface for pluggable building segmentation models.
    Decouples GIS pipeline from specific computer vision architectures (U-Net, ResNet, etc.).
    """

    @abstractmethod
    def predict(self, image_tile: np.ndarray) -> np.ndarray:
        """
        Runs model inference on an input RGB/multispectral tile.
        
        Args:
            image_tile: NumPy array of shape (H, W, C) or (C, H, W) in uint8 [0..255] or float [0..1].
            
        Returns:
            probability_mask: 2D NumPy array of shape (H, W) with float values in [0.0, 1.0].
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Returns model architecture name, version, input dimensions, and provenance.
        """
        pass
