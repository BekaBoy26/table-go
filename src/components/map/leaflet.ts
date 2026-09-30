import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker points to image files that bundlers don't copy,
// so we use our own SVG pin.
const pinSvg = (color: string) => `
  <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 39s13-12.2 13-23A13 13 0 0 0 3 16c0 10.8 13 23 13 23Z" style="fill: ${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="5" fill="white"/>
  </svg>`;

const makePin = (color: string) =>
  L.divIcon({
    html: pinSvg(color),
    className: "map-pin",
    iconSize: [32, 40],
    iconAnchor: [16, 39],
    popupAnchor: [0, -36],
  });

export const pin = makePin("var(--primary)");
export const pinMuted = makePin("var(--muted-foreground)");

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
