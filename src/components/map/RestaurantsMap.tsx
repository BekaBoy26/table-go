"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Status from "@/components/shared/Status";
import RestaurantImage from "@/components/shared/RestaurantImage";
import { BISHKEK } from "@/lib/data";
import { Restaurant, hasLocation } from "@/lib/restaurants";
import { formatPrice } from "@/lib/utils";
import { TILE_ATTRIBUTION, TILE_URL, pin, pinMuted } from "./leaflet";

type Located = Restaurant & { latitude: number; longitude: number };

/** Zooms the map to show every pin whenever the (filtered) list changes. */
const FitBounds = ({ points }: { points: Located[] }) => {
  const map = useMap();
  const key = points.map((p) => p.id).join();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the set of pins changes
  }, [map, key]);

  return null;
};

const RestaurantsMap = ({ restaurants }: { restaurants: Restaurant[] }) => {
  const points = restaurants.filter(hasLocation);

  return (
    <MapContainer center={BISHKEK} zoom={12} scrollWheelZoom className="size-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitBounds points={points} />

      {points.map((r) => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={r.availableToday ? pin : pinMuted} title={r.name}>
          <Popup minWidth={220} maxWidth={220}>
            <div className="-mx-1 space-y-2 font-sans">
              <div className="relative h-24 overflow-hidden rounded-lg">
                <RestaurantImage src={r.image} alt={r.name} fill sizes="220px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[r.cuisine, formatPrice(r.priceMin, r.priceMax)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Status type={r.availableToday ? "available" : "booked"} />
              <Link
                href={`/restaurant/${r.id}`}
                className="block rounded-lg bg-primary py-1.5 text-center text-xs font-medium !text-white hover:bg-primary/90"
              >
                View restaurant
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default RestaurantsMap;
