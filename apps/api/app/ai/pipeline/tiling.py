"""
BhuSetu 3D Windowed Tiler & Seamless Merge Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from typing import List, Tuple, Generator
import numpy as np


class WindowedTiler:
    """
    Slices large geospatial rasters into overlapping sub-windows
    to prevent out-of-memory spikes and maintain high-resolution inference.
    """

    def __init__(self, tile_size: int = 256, overlap: int = 32):
        self.tile_size = tile_size
        self.overlap = overlap
        self.stride = tile_size - overlap

    def generate_windows(self, height: int, width: int) -> List[Tuple[int, int, int, int]]:
        """
        Calculates all window slices (y1, y2, x1, x2) covering (height, width).
        """
        windows = []
        y = 0
        while y < height:
            y_end = min(y + self.tile_size, height)
            y_start = max(0, y_end - self.tile_size) if y_end == height and y > 0 else y

            x = 0
            while x < width:
                x_end = min(x + self.tile_size, width)
                x_start = max(0, x_end - self.tile_size) if x_end == width and x > 0 else x

                windows.append((y_start, y_end, x_start, x_end))
                if x_end == width:
                    break
                x += self.stride

            if y_end == height:
                break
            y += self.stride

        return windows


class TileMerger:
    """
    Reconstructs full-sized probability masks from overlapping tile predictions
    using weighted distance blending to avoid edge discontinuities.
    """

    def __init__(self, height: int, width: int):
        self.height = height
        self.width = width
        self.canvas = np.zeros((height, width), dtype=np.float32)
        self.weights = np.zeros((height, width), dtype=np.float32)

    @staticmethod
    def _create_weight_mask(tile_h: int, tile_w: int) -> np.ndarray:
        """Creates a smooth linear gradient weight mask emphasizing the center of the tile."""
        y_grad = np.minimum(np.arange(tile_h), np.arange(tile_h)[::-1]) + 1
        x_grad = np.minimum(np.arange(tile_w), np.arange(tile_w)[::-1]) + 1
        mask = np.outer(y_grad, x_grad).astype(np.float32)
        return mask / mask.max()

    def add_tile(self, tile_pred: np.ndarray, y1: int, y2: int, x1: int, x2: int) -> None:
        """Blends a predicted tile into the canvas."""
        th = y2 - y1
        tw = x2 - x1
        w_mask = self._create_weight_mask(th, tw)

        self.canvas[y1:y2, x1:x2] += tile_pred[:th, :tw] * w_mask
        self.weights[y1:y2, x1:x2] += w_mask

    def get_merged_result(self) -> np.ndarray:
        """Returns the normalized, blended full-resolution probability map."""
        valid_mask = self.weights > 0
        result = np.zeros((self.height, self.width), dtype=np.float32)
        result[valid_mask] = self.canvas[valid_mask] / self.weights[valid_mask]
        return np.clip(result, 0.0, 1.0)
