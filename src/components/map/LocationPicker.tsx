"use client";

import React, { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { BISHKEK } from "@/lib/data";
import { TILE_ATTRIBUTION, TILE_URL, pin } from "./leaflet";

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  /** Set to a new object to zoom the map to that point (e.g. a search result). */
  focus?: LatLng | null;
};

const round = (n: number) => Math.round(n * 1e6) / 1e6;

const ClickHandler = ({ onChange }: Pick<Props, "onChange">) => {
  useMapEvents({
    click: (e) => onChange({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) }),
  });
  return null;
};

/** The map's center is only read on mount, so later jumps go through the map API. */
const FlyTo = ({ focus }: Pick<Props, "focus">) => {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 17, { duration: 0.8 });
  }, [map, focus]);
  return null;
};

/** Click on the map (or drag the pin) to set the restaurant's location. */
const LocationPicker = ({ value, onChange, focus }: Props) => (
  <MapContainer
    center={value ? [value.lat, value.lng] : BISHKEK}
    zoom={value ? 16 : 12}
    scrollWheelZoom
    className="size-full cursor-crosshair"
  >
    <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
    <ClickHandler onChange={onChange} />
    <FlyTo focus={focus} />
    {value && (
      <Marker
        position={[value.lat, value.lng]}
        icon={pin}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            onChange({ lat: round(lat), lng: round(lng) });
          },
        }}
      />
    )}
  </MapContainer>
);

export default LocationPicker;
