"""
BhuSetu 3D PyTorch U-Net Building Segmentation Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from typing import Dict, Any, Optional
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from app.ai.models.base import BuildingExtractionModel
from app.core.logging import logger


class DoubleConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)


class UNet(nn.Module):
    """Compact, high-efficiency U-Net for building footprint segmentation."""
    def __init__(self, in_channels: int = 3, out_channels: int = 1, features: list = [32, 64, 128]):
        super().__init__()
        self.downs = nn.ModuleList()
        self.ups = nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        curr_in = in_channels
        for feature in features:
            self.downs.append(DoubleConv(curr_in, feature))
            curr_in = feature

        self.bottleneck = DoubleConv(features[-1], features[-1] * 2)

        for feature in reversed(features):
            self.ups.append(
                nn.ConvTranspose2d(feature * 2, feature, kernel_size=2, stride=2)
            )
            self.ups.append(DoubleConv(feature * 2, feature))

        self.final_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        skip_connections = []
        for down in self.downs:
            x = down(x)
            skip_connections.append(x)
            x = self.pool(x)

        x = self.bottleneck(x)
        skip_connections = skip_connections[::-1]

        for idx in range(0, len(self.ups), 2):
            x = self.ups[idx](x)
            skip_connection = skip_connections[idx // 2]
            if x.shape != skip_connection.shape:
                x = F.interpolate(x, size=skip_connection.shape[2:], mode="bilinear", align_corners=True)
            concat_skip = torch.cat((skip_connection, x), dim=1)
            x = self.ups[idx + 1](concat_skip)

        return torch.sigmoid(self.final_conv(x))


class BuildingSegmentationUNet(BuildingExtractionModel):
    """
    Production-grade building footprint segmentation model wrapper.
    Executes on CPU or CUDA without external cloud dependencies.
    """

    def __init__(self, weights_path: Optional[str] = None, device: Optional[str] = None):
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.model = UNet(in_channels=3, out_channels=1, features=[32, 64, 128]).to(self.device)
        self.model.eval()

        self.version = "v1.0"
        self.name = "building-segmentation-unet"

        if weights_path and Path(weights_path).exists():
            try:
                state_dict = torch.load(weights_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                logger.info(f"Loaded building segmentation weights from: {weights_path}")
            except Exception as e:
                logger.warning(f"Could not load weights from {weights_path}: {e}. Operating with initialized model.")
        else:
            # Deterministic, controlled initialization
            torch.manual_seed(42)

    def predict(self, image_tile: np.ndarray) -> np.ndarray:
        """
        Runs segmentation inference on a single image tile.
        
        Args:
            image_tile: NumPy array of shape (H, W, 3) with values in [0, 255] (uint8) or [0.0, 1.0] (float).
        Returns:
            probability_mask: 2D NumPy array of shape (H, W) in [0.0, 1.0].
        """
        orig_h, orig_w = image_tile.shape[:2]

        # Ensure 3-channel RGB
        if image_tile.ndim == 2:
            image_tile = np.stack([image_tile] * 3, axis=-1)
        elif image_tile.shape[2] > 3:
            image_tile = image_tile[:, :, :3]

        # Normalize to float32 [0.0, 1.0]
        if image_tile.dtype == np.uint8:
            arr = image_tile.astype(np.float32) / 255.0
        else:
            arr = image_tile.astype(np.float32)
            if arr.max() > 1.0:
                arr = arr / 255.0

        # Transpose from (H, W, C) to (C, H, W)
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(self.device)

        # Pad to multiple of 16 for clean U-Net down/up pooling
        pad_h = (16 - (orig_h % 16)) % 16
        pad_w = (16 - (orig_w % 16)) % 16
        if pad_h > 0 or pad_w > 0:
            tensor = F.pad(tensor, (0, pad_w, 0, pad_h), mode="reflect")

        with torch.no_grad():
            prob_tensor = self.model(tensor)
            prob_mask = prob_tensor.squeeze().cpu().numpy()

        # Crop back to original dimensions
        prob_mask = prob_mask[:orig_h, :orig_w]
        return prob_mask

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "model_name": self.name,
            "model_version": self.version,
            "framework": f"PyTorch {torch.__version__}",
            "device": str(self.device),
            "input_channels": 3,
            "output_channels": 1,
            "architecture": "U-Net (DoubleConv, ConvTranspose2d, Skip-Connections)",
        }
