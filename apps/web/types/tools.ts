/**
 * BhuSetu 3D Spatial Tools & Navigation Types
 * Phase 7: Spatial Tools, Navigation, First-Class Measurement & Comparison
 */
import { ActiveSpatialSelection } from "./selection";

export type SpatialToolType =
  | "SELECT"
  | "MEASURE"
  | "COMPARE"
  | "CAMERA"
  | "LAYERS"
  | "TIMELINE";

export type MeasurementMode = "DISTANCE" | "HEIGHT" | "AREA";

export interface MeasurementResult {
  mode: MeasurementMode;
  distance?: number; // 3D Euclidean distance in meters
  horizontalDistance?: number; // 2D ground projection distance in meters
  heightDelta?: number; // Vertical height delta in meters
  area?: number; // Planar / polygon area in square meters
  perimeter?: number; // Polygon perimeter in meters
  pointCount: number;
  formattedValue: string;
  isComplete: boolean;
}

export interface ComparisonState {
  isActive: boolean;
  entityA: ActiveSpatialSelection | null;
  entityB: ActiveSpatialSelection | null;
  status: "SELECTING_A" | "SELECTING_B" | "COMPARING";
}

export type CameraViewPreset =
  | "CITY"
  | "PARCEL"
  | "BUILDING"
  | "FLOOR"
  | "UNIT"
  | "ROOM"
  | "TOP_DOWN"
  | "NORTH"
  | "FIT";

export interface CameraTelemetry {
  heading: number; // In degrees (0 = North, 90 = East, 180 = South, 270 = West)
  pitch: number; // In degrees (-90 = Nadir, 0 = Horizon)
  altitude: number; // Height in meters above ellipsoid
}
