"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/restaurants";

export type Place = {
  id: string;
  type: string;
  name: string;
  /** Street and number as 2GIS writes them, e.g. "проспект Чуй, 123". */
  address: string | null;
  lat: number;
  lng: number;
  gisLink: string | null;
};

const DEBOUNCE_MS = 350;

/** Address / place search via the API's 2GIS proxy; picking a result sets the pin. */
const PlaceSearch = ({ onPick }: { onPick: (place: Place) => void }) => {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // search once typing pauses, not on every key
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const { data: places = [], isFetching, error } = useQuery({
    queryKey: ["geo", query],
    queryFn: async () => (await api.get<Place[]>("/geo/search", { params: { q: query } })).data,
    enabled: query.length >= 3,
    staleTime: 5 * 60_000,
  });

  const pick = (place: Place) => {
    onPick(place);
    setText(place.address ?? place.name);
    setOpen(false);
  };

  const showList = open && query.length >= 3 && !isFetching;

  return (
    <div className="relative">
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // let a click on a result land before the list closes
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Enter picks the first result instead of submitting the form
            e.preventDefault();
            if (places[0]) pick(places[0]);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Find on map: address or place name in Russian, e.g. проспект Чуй 123"
        aria-label="Find on map"
        className="h-10 rounded-xl pl-9"
      />
      {isFetching && <Loader2 size={16} className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted-foreground" />}

      {showList && (
        // above Leaflet's panes
        <ul className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-72 overflow-y-auto rounded-xl bg-popover p-1 shadow-lg ring-1 ring-border">
          {error ? (
            <li className="px-3 py-2 text-sm text-destructive">{errorMessage(error)}</li>
          ) : !places.length ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Nothing found in Bishkek — try the address in Russian</li>
          ) : (
            places.map((p) => {
              const Icon = p.type === "branch" ? Store : Building2;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p)}
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
                  >
                    <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      {p.address && p.address !== p.name && (
                        <span className="block truncate text-xs text-muted-foreground">{p.address}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearch;
