/**
 * BhuSetu 3D Native PostGIS Spatial Data Provider
 * Recovery Phase 1: Pure BhuSetu Spatial Geometry Management
 *
 * Principles:
 * 1. Represents authoritative spatial geometry owned by BhuSetu and stored in Supabase/PostGIS.
 * 2. Never invents fake buildings, fake floors, or fake units if not present in the database.
 * 3. Clearly tags BhuSetu properties with `_isBhuSetuProperty = true` for high-confidence legal inspection.
 */

import { SpatialHierarchyTreeResponse } from "@/types/property";

export class BhuSetuNativeProviderManager {
  /**
   * Evaluates whether BhuSetu-owned PostGIS geometry exists for the active scene/property.
   */
  public hasAuthoritativeGeometry(
    treeData?: SpatialHierarchyTreeResponse | null,
    selectedBuildingId?: string | null,
    selectedParcelId?: string | null
  ): boolean {
    if (!treeData || !treeData.city) return false;

    // Check if there are active parcels or buildings in the hierarchy tree
    const regions = treeData.city.regions || [];
    const allParcels = regions.flatMap((r) => r.parcels || []);
    if (allParcels.length === 0) return false;

    if (selectedBuildingId) {
      const allBuildings = allParcels.flatMap((p) => p.buildings || []);
      return allBuildings.some((b) => b.id === selectedBuildingId);
    }

    if (selectedParcelId) {
      return allParcels.some((p) => p.id === selectedParcelId);
    }

    return allParcels.length > 0;
  }

  /**
   * Helper to format authoritative property attribution for inspector
   */
  public getAttribution(): string {
    return "BhuSetu 3D Cadastral Registry (PostGIS / KSRSAC / BBMP Authoritative)";
  }
}
