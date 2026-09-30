"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Leaflet touches `window` on import, so maps are client-only.
const Loading = () => (
  <div className="grid size-full place-items-center bg-muted text-muted-foreground">
    <Loader2 className="animate-spin" size={20} />
  </div>
);

export const RestaurantsMap = dynamic(() => import("./RestaurantsMap"), { ssr: false, loading: Loading });

export const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false, loading: Loading });

export type { LatLng } from "./LocationPicker";
