import React from "react";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";

export default function Loading() {
  return (
    <SpatialLoadingRoller
      fullScreen={true}
      label="Loading Workspace"
      subtitle="Streaming 3D cadastral massing, spatial intelligence & terrain tiles..."
    />
  );
}
