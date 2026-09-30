"use client";

import React from "react";
import {
  ChevronRight,
  ArrowUp,
  Globe2,
  MapPin,
  Building2,
  Layers,
  DoorOpen,
  LayoutGrid,
} from "lucide-react";

export type SpatialLevel =
  | "CITY"
  | "REGION"
  | "PARCEL"
  | "BUILDING"
  | "FLOOR"
  | "UNIT"
  | "ROOM"
  | "HALL"
  | "CORRIDOR"
  | "DOOR"
  | "WINDOW"
  | "INFRASTRUCTURE"
  | "ELEMENT";

interface WorkspaceBreadcrumbProps {
  currentLevel: SpatialLevel;
  regionName?: string;
  parcelName?: string;
  buildingName?: string;
  floorName?: string;
  unitName?: string;
  roomName?: string;
  elementName?: string;
  onNavigateToLevel: (level: SpatialLevel) => void;
  onUpOneLevel: () => void;
  isLeftPanelCollapsed?: boolean;
  isRightPanelOpen?: boolean;
}

export const WorkspaceBreadcrumb: React.FC<WorkspaceBreadcrumbProps> = ({
  currentLevel,
  regionName = "Malleshwaram Zone",
  parcelName = "Parcel 102/3B",
  buildingName = "Aura Horizon Commercial",
  floorName = "Floor 03",
  unitName = "Unit 302",
  roomName = "Room 302",
  elementName = "Door D-302-A",
  onNavigateToLevel,
  onUpOneLevel,
  isLeftPanelCollapsed = false,
  isRightPanelOpen = true,
}) => {
  const isCity = currentLevel === "CITY";
  const [isWide, setIsWide] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const checkWidth = () => setIsWide(window.innerWidth >= 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <nav
      role="navigation"
      aria-label="Spatial hierarchy navigation breadcrumb"
      className="absolute z-20 flex pointer-events-none select-none transition-all duration-300 ease-out justify-start"
      style={{
        top: "116px",
        left: isWide ? (isLeftPanelCollapsed ? "68px" : "344px") : "12px",
        right: isWide ? (isRightPanelOpen ? "415px" : (!isCity ? "320px" : "20px")) : "12px",
      }}
    >
      <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] shadow-xl text-xs sm:text-[13px] font-mono max-w-full overflow-x-auto no-scrollbar scroll-smooth flex-nowrap touch-manipulation">
        {/* Up One Level Action Button */}
        {!isCity && (
          <button
            onClick={onUpOneLevel}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#222A26] text-[#F4F0E8] border border-[rgba(244,240,232,0.12)] transition-all mr-1 cursor-pointer shrink-0"
            title="Up One Level"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#C47B50]" />
            <span className="text-xs font-semibold hidden xs:inline">Up</span>
          </button>
        )}

        {/* Level 1: City */}
        <button
          onClick={() => onNavigateToLevel("CITY")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
            currentLevel === "CITY"
              ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
              : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
          }`}
        >
          <Globe2 className="w-3.5 h-3.5 text-[#23847D]" />
          <span>City</span>
        </button>

        {/* Level 2: Region (Optional / Contextual) */}
        {currentLevel === "REGION" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("REGION")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] font-bold cursor-pointer shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-[#23847D]" />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{regionName}</span>
            </button>
          </>
        )}

        {/* Level 3: Parcel */}
        {(currentLevel === "PARCEL" ||
          currentLevel === "BUILDING" ||
          currentLevel === "FLOOR" ||
          currentLevel === "UNIT" ||
          currentLevel === "ROOM" ||
          currentLevel === "DOOR" ||
          currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("PARCEL")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
                currentLevel === "PARCEL"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#23847D]" />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{parcelName}</span>
            </button>
          </>
        )}

        {/* Level 4: Building */}
        {(currentLevel === "BUILDING" ||
          currentLevel === "FLOOR" ||
          currentLevel === "UNIT" ||
          currentLevel === "ROOM" ||
          currentLevel === "DOOR" ||
          currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("BUILDING")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
                currentLevel === "BUILDING"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#C47B50]" />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{buildingName}</span>
            </button>
          </>
        )}

        {/* Level 5: Floor */}
        {(currentLevel === "FLOOR" ||
          currentLevel === "UNIT" ||
          currentLevel === "ROOM" ||
          currentLevel === "DOOR" ||
          currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("FLOOR")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
                currentLevel === "FLOOR"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#23847D]" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{floorName}</span>
            </button>
          </>
        )}

        {/* Level 6: Unit */}
        {(currentLevel === "UNIT" ||
          currentLevel === "ROOM" ||
          currentLevel === "DOOR" ||
          currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("UNIT")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
                currentLevel === "UNIT"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#C47B50]" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{unitName}</span>
            </button>
          </>
        )}

        {/* Level 7: Room */}
        {(currentLevel === "ROOM" ||
          currentLevel === "DOOR" ||
          currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("ROOM")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] transition-all cursor-pointer shrink-0 ${
                currentLevel === "ROOM"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#23847D]" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{roomName}</span>
            </button>
          </>
        )}

        {/* Level 8: Element (Door / Window) */}
        {(currentLevel === "DOOR" || currentLevel === "ELEMENT") && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#6F7772] shrink-0" />
            <button
              onClick={() => onNavigateToLevel("ELEMENT")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] font-bold cursor-pointer shrink-0"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#C47B50]" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{elementName}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
