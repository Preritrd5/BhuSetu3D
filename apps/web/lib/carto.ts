/**
 * BhuSetu 3D Centralized CARTO Basemap Configuration
 * Connects to process.env.NEXT_PUBLIC_CARTO_BASEMAP_API_KEY
 * Provides colorful Voyager, Dark Matter, and Positron raster tile providers.
 */

export type BasemapStyle = "voyager" | "dark" | "positron";

export const CARTO_BASEMAP_CONFIG = {
  getApiKey(): string | undefined {
    return process.env.NEXT_PUBLIC_CARTO_BASEMAP_API_KEY?.trim() || undefined;
  },

  /**
   * Returns authenticated Cesium URL template for raster tiles
   */
  getCesiumTileUrl(style: "voyager" | "dark_all" | "rastertiles/voyager" | "rastertiles/dark_all" = "rastertiles/voyager"): string {
    const key = this.getApiKey();
    const basePath = style.includes("dark") ? "rastertiles/dark_all" : "rastertiles/voyager";
    const base = "https://{s}.basemaps.cartocdn.com/" + basePath + "/{z}/{x}/{y}.png";
    return key ? `${base}?key=${encodeURIComponent(key)}` : base;
  },

  /**
   * Subdomains supported by CARTO CDN
   */
  subdomains: ["a", "b", "c", "d"],

  /**
   * Returns authenticated MapLibre / Mapbox tile URLs array for CARTO Voyager (vivid, colorful)
   */
  getVoyagerTiles(retina: boolean = true): string[] {
    const key = this.getApiKey();
    const query = key ? `?key=${encodeURIComponent(key)}` : "";
    const suffix = retina ? "@2x.png" : ".png";
    return this.subdomains.map(
      (sub) => `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${suffix}${query}`
    );
  },

  /**
   * Returns authenticated MapLibre tile URLs for CARTO Dark Matter
   */
  getDarkTiles(retina: boolean = true): string[] {
    const key = this.getApiKey();
    const query = key ? `?key=${encodeURIComponent(key)}` : "";
    const suffix = retina ? "@2x.png" : ".png";
    return this.subdomains.map(
      (sub) => `https://${sub}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}${suffix}${query}`
    );
  },

  /**
   * Returns authenticated MapLibre tile URLs for CARTO Positron (light mode)
   */
  getPositronTiles(retina: boolean = true): string[] {
    const key = this.getApiKey();
    const query = key ? `?key=${encodeURIComponent(key)}` : "";
    const suffix = retina ? "@2x.png" : ".png";
    return this.subdomains.map(
      (sub) => `https://${sub}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}${suffix}${query}`
    );
  },

  /**
   * Default tile provider (Voyager - Colorful)
   */
  getMapLibreTiles(retina: boolean = true): string[] {
    return this.getVoyagerTiles(retina);
  },

  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
};
