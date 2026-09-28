import fs from "fs";
import path from "path";
import { URBAN_PARCELS, URBAN_BUILDINGS } from "../lib/cesium/data/urbanEnvironmentData";

const data = {
  parcels: URBAN_PARCELS,
  buildings: URBAN_BUILDINGS,
};

const outPath = path.resolve(__dirname, "../../urban_environment_seed.json");
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
console.log(`Exported ${URBAN_PARCELS.length} parcels and ${URBAN_BUILDINGS.length} buildings to ${outPath}`);
