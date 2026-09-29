"use client";

import React, { useEffect, useState } from "react";
import {
  Compass,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Ruler,
  Layers,
  Info,
  Maximize2,
  Building2,
  ExternalLink,
} from "lucide-react";
import {
  getBuildingSpatialIntelligence,
  getParcelSpatialIntelligence,
} from "@/lib/api/properties";
import {
  BuildingSpatialIntelligence,
  ParcelSpatialIntelligence,
} from "@/types/spatialIntelligence";
import { getUrbanBuildingById, getUrbanParcelById } from "@/lib/cesium";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";

interface PostGISSpatialIntelligenceCardProps {
  entityType: "BUILDING" | "PARCEL";
  entityId: string;
  onSelectProperty?: (type: "BUILDING" | "PARCEL", id: string) => void;
}

export const PostGISSpatialIntelligenceCard: React.FC<PostGISSpatialIntelligenceCardProps> = ({
  entityType,
  entityId,
  onSelectProperty,
}) => {
  const [bldIntel, setBldIntel] = useState<BuildingSpatialIntelligence | null>(null);
  const [pclIntel, setPclIntel] = useState<ParcelSpatialIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    if (entityType === "BUILDING") {
      getBuildingSpatialIntelligence(entityId)
        .then((data) => {
          if (isMounted) {
            setBldIntel(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.warn(`[POSTGIS_INTEL] API fallback for building ${entityId}:`, err);
            // Fallback to local urbanEnvironmentData if backend is unavailable
            const localBld = getUrbanBuildingById(entityId);
            if (localBld) {
              const localPcl = getUrbanParcelById(localBld.parcelId);
              setBldIntel({
                building_id: localBld.buildingId,
                building_code: localBld.code,
                name: localBld.name,
                typology: localBld.typologyLabel,
                centroid: { longitude: localBld.centroid[0], latitude: localBld.centroid[1] },
                footprint_area_sqm: Math.round(localBld.footprint.length * 125.0),
                building_height: localBld.height,
                sanctioned_floors: localBld.floorCount,
                detected_floors: localBld.floorCount + (localBld.hasConflict ? 1 : 0),
                has_conflict: !!localBld.hasConflict,
                parent_parcel: localPcl
                  ? {
                      parcel_id: localPcl.parcelId,
                      ulpin: localPcl.ulpin,
                      survey_number: localPcl.surveyNumber,
                      parcel_area_sqm: localPcl.areaSqm,
                      is_contained: !localBld.hasConflict,
                      setback_distance_meters: localBld.hasConflict ? 0.0 : 5.2,
                      encroachment_status: localBld.hasConflict ? "ENCROACHING" : "COMPLIANT",
                    }
                  : null,
                nearby_buildings: [],
                spatial_source: {
                  provenance_status: "ILLUSTRATIVE",
                  source_type: "DEMO_SYNTHETIC",
                  confidence_score: 0.95,
                  crs: "EPSG:4326 (WGS 84)",
                  authority: "BBMP / Survey of India (Digital Twin Prototype)",
                  disclaimer: "Offline illustrative fallback geometry.",
                },
              });
            }
            setIsLoading(false);
          }
        });
    } else {
      getParcelSpatialIntelligence(entityId)
        .then((data) => {
          if (isMounted) {
            setPclIntel(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.warn(`[POSTGIS_INTEL] API fallback for parcel ${entityId}:`, err);
            const localPcl = getUrbanParcelById(entityId);
            if (localPcl) {
              setPclIntel({
                parcel_id: localPcl.parcelId,
                ulpin: localPcl.ulpin,
                survey_number: localPcl.surveyNumber,
                land_use: localPcl.category,
                centroid: { longitude: localPcl.centroid[0], latitude: localPcl.centroid[1] },
                computed_area_sqm: localPcl.areaSqm,
                recorded_area_sqm: localPcl.areaSqm,
                area_discrepancy_sqm: 0.0,
                buildings_count: localPcl.primaryBuildingIds.length,
                building_codes: localPcl.primaryBuildingIds,
                nearby_parcels: [],
                spatial_source: {
                  provenance_status: "ILLUSTRATIVE",
                  source_type: "DEMO_SYNTHETIC",
                  confidence_score: 0.95,
                  crs: "EPSG:4326 (WGS 84)",
                  authority: "BBMP / Survey of India (Digital Twin Prototype)",
                  disclaimer: "Offline illustrative fallback geometry.",
                },
              });
            }
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-[12px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
        <SpatialLoadingRoller
          size="sm"
          label="QUERYING POSTGIS INTELLIGENCE"
          subtitle="Calculating 3D polygon metrics & containment..."
          showCoordinates={false}
        />
      </div>
    );
  }

  if (entityType === "BUILDING" && bldIntel) {
    const isContained = bldIntel.parent_parcel?.is_contained ?? true;
    return (
      <div className="space-y-3">
        {/* PostGIS Geodesic Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">PostGIS Footprint Area</span>
            <span className="text-base font-bold text-[#F4F0E8] block mt-0.5">
              {bldIntel.footprint_area_sqm.toLocaleString()} <span className="text-xs text-[#A7B3AB]">m²</span>
            </span>
            <span className="text-[11px] text-[#23847D] font-sans mt-0.5 block">ST_Area (geography)</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">Boundary Containment</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isContained ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#23847D]" />
                  <span className="text-xs font-bold text-[#23847D]">CONTAINED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-rose-400">ENCROACHING</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">ST_Within evaluated</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">PostGIS Centroid</span>
            <span className="text-[11px] font-semibold text-[#F4F0E8] block mt-0.5">
              {bldIntel.centroid.longitude.toFixed(5)}°, {bldIntel.centroid.latitude.toFixed(5)}°
            </span>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">ST_Centroid (WGS 84)</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">Setback Clearance</span>
            <span className="text-base font-bold text-[#F4F0E8] block mt-0.5">
              {bldIntel.parent_parcel?.setback_distance_meters ?? 0} <span className="text-xs text-[#A7B3AB]">m</span>
            </span>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">ST_Distance boundary</span>
          </div>
        </div>

        {/* Parent Cadastral Parcel Link */}
        {bldIntel.parent_parcel && (
          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block font-medium">CADASTRE PARCEL REFERENCE</span>
              <span className="text-xs font-semibold text-[#F4F0E8] block">
                {bldIntel.parent_parcel.survey_number} ({bldIntel.parent_parcel.ulpin})
              </span>
            </div>
            {onSelectProperty && (
              <button
                onClick={() => onSelectProperty("PARCEL", bldIntel.parent_parcel!.parcel_id)}
                className="px-2 py-1 rounded-[6px] bg-[#1A201D] hover:bg-[#243029] text-[11px] text-[#23847D] font-mono flex items-center gap-1 transition-all"
              >
                <span>Inspect</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Nearby Buildings within 150m */}
        {bldIntel.nearby_buildings.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#A2B3A8]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Nearby Structures (150m Radius)
              </span>
              <span className="text-[11px] font-mono">{bldIntel.nearby_buildings.length} found</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {bldIntel.nearby_buildings.map((nb) => (
                <div
                  key={nb.id}
                  onClick={() => onSelectProperty && onSelectProperty("BUILDING", nb.id)}
                  className="p-2 rounded-[8px] bg-[#0F1210] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.06)] flex items-center justify-between cursor-pointer transition-all text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-medium text-[#F4F0E8] block truncate">{nb.name}</span>
                    <span className="text-[11px] text-[#A7B3AB] font-mono block">{nb.building_code}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#23847D] shrink-0">
                    {nb.distance_meters} m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honest Provenance Banner */}
        <div className="p-2.5 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#A6AEA8] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#23847D] shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-[#D9D2C5] uppercase block tracking-wider">
              SOURCE: {bldIntel.spatial_source.source_type} ({bldIntel.spatial_source.provenance_status})
            </span>
            <span className="text-[11px] text-[#94A3B8] block mt-0.5">
              {bldIntel.spatial_source.disclaimer}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (entityType === "PARCEL" && pclIntel) {
    return (
      <div className="space-y-3">
        {/* PostGIS Geodesic Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">PostGIS Geodesic Area</span>
            <span className="text-base font-bold text-[#F4F0E8] block mt-0.5">
              {pclIntel.computed_area_sqm.toLocaleString()} <span className="text-xs text-[#A7B3AB]">m²</span>
            </span>
            <span className="text-[11px] text-[#23847D] font-sans mt-0.5 block">ST_Area (geography)</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">Survey Discrepancy</span>
            <span className="text-base font-bold text-[#F4F0E8] block mt-0.5">
              {pclIntel.area_discrepancy_sqm.toLocaleString()} <span className="text-xs text-[#A7B3AB]">m²</span>
            </span>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">Record vs Computed</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">PostGIS Centroid</span>
            <span className="text-[11px] font-semibold text-[#F4F0E8] block mt-0.5">
              {pclIntel.centroid.longitude.toFixed(5)}°, {pclIntel.centroid.latitude.toFixed(5)}°
            </span>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">ST_Centroid (WGS 84)</span>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
            <span className="text-[11px] text-[#94A3B8] block uppercase font-medium">Structures Situated</span>
            <span className="text-base font-bold text-[#F4F0E8] block mt-0.5">
              {pclIntel.buildings_count} <span className="text-xs text-[#A7B3AB]">buildings</span>
            </span>
            <span className="text-[11px] text-[#A7B3AB] font-sans mt-0.5 block">PostGIS containment</span>
          </div>
        </div>

        {/* Nearby Parcels within 150m */}
        {pclIntel.nearby_parcels.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#A2B3A8]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Adjacent & Nearby Parcels
              </span>
              <span className="text-[11px] font-mono">{pclIntel.nearby_parcels.length} found</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {pclIntel.nearby_parcels.map((np) => (
                <div
                  key={np.id}
                  onClick={() => onSelectProperty && onSelectProperty("PARCEL", np.id)}
                  className="p-2 rounded-[8px] bg-[#0F1210] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.06)] flex items-center justify-between cursor-pointer transition-all text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-medium text-[#F4F0E8] block truncate">
                      {np.survey_number}
                    </span>
                    <span className="text-[11px] text-[#A7B3AB] font-mono block">
                      {np.ulpin} · {np.land_use}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#23847D] shrink-0">
                    {np.distance_meters} m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honest Provenance Banner */}
        <div className="p-2.5 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#A6AEA8] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#23847D] shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-[#D9D2C5] uppercase block tracking-wider">
              SOURCE: {pclIntel.spatial_source.source_type} ({pclIntel.spatial_source.provenance_status})
            </span>
            <span className="text-[11px] text-[#94A3B8] block mt-0.5">
              {pclIntel.spatial_source.disclaimer}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
