/**
 * BhuSetu 3D Centralized CARTO Basemap Configuration
 * Connects to process.env.NEXT_PUBLIC_CARTO_BASEMAP_API_KEY
 */

export const CARTO_BASEMAP_CONFIG = {
  getApiKey(): string | undefined {
    return process.env.NEXT_PUBLIC_CARTO_BASEMAP_API_KEY?.trim() || undefined;
  },

  /**
   * Returns authenticated Cesium URL template for raster dark tiles
   */
  getCesiumTileUrl(style: "dark_all" | "rastertiles/dark_all" = "rastertiles/dark_all"): string {
    const key = this.getApiKey();
    const basePath = style === "rastertiles/dark_all" ? "rastertiles/dark_all" : "dark_all";
    const base = `https://{s}.basemaps.cartocdn.com/${basePath}/{z}/{x}/{y}.png`;
    return key ? `${base}?key=${encodeURIComponent(key)}` : base;
  },

  /**
   * Subdomains supported by CARTO CDN
   */
  subdomains: ["a", "b", "c", "d"],

  /**
   * Returns authenticated MapLibre / Mapbox tile URLs array
   */
  getMapLibreTiles(retina: boolean = true): string[] {
    const key = this.getApiKey();
    const query = key ? `?key=${encodeURIComponent(key)}` : "";
    const suffix = retina ? "@2x.png" : ".png";
    return this.subdomains.map(
      (sub) => `https://${sub}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}${suffix}${query}`
    );
  },

  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
};
