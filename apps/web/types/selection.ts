/**
 * BhuSetu 3D Spatial Selection & Inspection System Types
 * Single Source of Truth for Contextual Inspectors & 3D Synchronization
 */
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

export type TrustSource =
  | "AUTHORITATIVE"
  | "DERIVED"
  | "AI-DERIVED"
  | "INFERRED"
  | "ILLUSTRATIVE"
  | "UNVERIFIED";

export type VerificationState =
  | "VERIFIED"
  | "REVIEW_REQUIRED"
  | "UNVERIFIED"
  | "DISCREPANCY_DETECTED";

export interface HierarchyPathNode {
  level: SpatialLevel;
  id: string;
  name: string;
  code?: string;
}

export interface InspectorActionItem {
  id: string;
  label: string;
  icon?: string;
  isPrimary?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onClick: () => void;
}

export interface ActiveSpatialSelection {
  entityType: SpatialLevel;
  entityId: string;
  parentId?: string | null;
  parentType?: SpatialLevel | null;
  title: string;
  subtitle?: string;
  code?: string;
  hierarchyPath: HierarchyPathNode[];
  geometryReference?: string | null;
  source: TrustSource;
  confidence?: number | null; // e.g., 0.98 or 98%
  verificationState: VerificationState;
  selectionState: "SELECTED" | "HOVERED" | "NONE";
  cameraTarget?: string | null;
  inspectionMode: {
    isolateBuilding?: boolean;
    isolateFloor?: boolean;
    explodeFloors?: boolean;
  };
  metadata?: Record<string, any>;
  rawNode?: any;
}
