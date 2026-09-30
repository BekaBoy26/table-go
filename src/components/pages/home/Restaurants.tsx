"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { prices } from "@/lib/data";
import { errorMessage, hasLocation, useRestaurants } from "@/lib/restaurants";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantsMap } from "@/components/map";
import RestaurantCard from "@/components/shared/RestaurantCard";

const chip = "rounded-full px-3 py-1.5 text-sm transition-colors";

const PAGE_SIZE = 6;
/** "Large group" = a restaurant with a table for at least this many guests. */
const LARGE_GROUP = 6;

const views = [
  { value: "list", label: "List", icon: LayoutGrid },
  { value: "map", label: "Map", icon: MapIcon },
] as const;

const Restaurants = ({ query }: { query: string }) => {
  const { data: restaurants = [], isPending, error } = useRestaurants();
  const [view, setView] = useState<"list" | "map">("list");
  const [cuisine, setCuisine] = useState("All");
  const [price, setPrice] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [today, setToday] = useState(false);
  const [largeGroup, setLargeGroup] = useState(false);
  // below 1024px the filters fold into a panel above the list
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters =
    (cuisine !== "All" ? 1 : 0) + (price ? 1 : 0) + tags.length + (today ? 1 : 0) + (largeGroup ? 1 : 0);

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const cuisines = ["All", ...new Set(restaurants.map((r) => r.cuisine).filter((c): c is string => !!c))].sort(
    (a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)),
  );

  // every tag that some restaurant has, so new tags from the admin show up here too
  const features = [...new Set(restaurants.flatMap((r) => r.tags))].sort();

  const { min, max } = prices[price];
  const q = query.toLowerCase();
  const list = restaurants.filter(
    (r) =>
      [r.name, r.address, r.gisAddress].some((s) => s?.toLowerCase().includes(q)) &&
      (cuisine === "All" || r.cuisine === cuisine) &&
      // restaurants without a price only show up under "Any price"
      (price === 0 || ((r.priceMin ?? r.priceMax ?? 0) < max && (r.priceMax ?? r.priceMin ?? 0) > min)) &&
      tags.every((t) => r.tags.includes(t)) &&
      (!today || r.availableToday) &&
      (!largeGroup || r.maxSeats >= LARGE_GROUP),
  );
  const withoutLocation = list.length - list.filter(hasLocation).length;

  // Any change of search or filters starts again from page 1 (no effect needed:
  // the stored page only counts while the filters it was chosen for are unchanged).
  const filterKey = JSON.stringify([query, cuisine, price, tags, today, largeGroup]);
  const [paging, setPaging] = useState({ key: filterKey, page: 1 });
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = paging.key === filterKey ? Math.min(paging.page, pages) : 1;
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const listTop = useRef<HTMLDivElement>(null);

  const goTo = (p: number) => {
    setPaging({ key: filterKey, page: p });
    // the header is sticky, so leave room for it
    const top = (listTop.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
      <button
        type="button"
        onClick={() => setFiltersOpen(!filtersOpen)}
        aria-expanded={filtersOpen}
        className="surface flex h-11 items-center gap-2 px-4 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal size={16} /> Filters
        {activeFilters > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-white">{activeFilters}</span>
        )}
        <span className="ml-auto text-muted-foreground">{filtersOpen ? "Hide" : "Show"}</span>
      </button>

      <aside
        className={cn(
          "surface w-full shrink-0 space-y-6 p-5 sm:p-6 lg:sticky lg:top-24 lg:block lg:w-64",
          !filtersOpen && "hidden",
        )}
      >
        <h2 className="hidden font-semibold lg:block">Filters</h2>

        <div className="space-y-3">
          <p className="caption">Cuisine</p>
          <div className="flex flex-wrap gap-2">
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className={cn(chip, c === cuisine ? "bg-primary text-white" : "bg-muted hover:bg-border")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="caption">Price per person</p>
          <div className="flex flex-col gap-1">
            {prices.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPrice(i)}
                className={cn(
                  "rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  i === price ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="caption">Availability</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={today} onChange={() => setToday(!today)} className="size-4 accent-primary" />
            Available today
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={largeGroup}
              onChange={() => setLargeGroup(!largeGroup)}
              className="size-4 accent-primary"
            />
            Large group ({LARGE_GROUP}+ guests)
          </label>
        </div>

        <div className="space-y-3">
          <p className="caption">Atmosphere</p>
          {features.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tags.includes(f)}
                onChange={() => toggleTag(f)}
                className="size-4 accent-primary"
              />
              {f}
            </label>
          ))}
        </div>
      </aside>

      <div ref={listTop} className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isPending ? (
              "Loading restaurants..."
            ) : (
              <>
                <b className="text-foreground">{list.length}</b> {list.length === 1 ? "restaurant" : "restaurants"} found
                {query && (
                  <>
                    {" "}for “{query}” ·{" "}
                    <Link href="/" className="font-medium text-primary hover:underline">
                      Clear
                    </Link>
                  </>
                )}
                {view === "map" && withoutLocation > 0 && <> · {withoutLocation} not on the map yet</>}
              </>
            )}
          </p>

          <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="View">
            {views.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  view === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="surface py-20 text-center text-muted-foreground">
            Could not load restaurants: {errorMessage(error)}
          </div>
        ) : isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : view === "map" ? (
          // `isolate` keeps Leaflet's high z-index panes below the sticky header
          <div className="surface isolate h-[60vh] min-h-[400px] overflow-hidden lg:h-[640px]">
            <RestaurantsMap restaurants={list} />
          </div>
        ) : list.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {pageItems.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
            {pages > 1 && <Pagination page={page} pages={pages} onChange={goTo} />}
          </>
        ) : (
          <div className="surface py-20 text-center text-muted-foreground">No restaurants match your filters</div>
        )}
      </div>
    </div>
  );
};

const pageButton = "grid size-10 place-items-center rounded-xl text-sm font-medium transition-colors";

const Pagination = ({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) => (
  <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-1.5">
    <button
      type="button"
      disabled={page === 1}
      onClick={() => onChange(page - 1)}
      aria-label="Previous page"
      className={cn(pageButton, "hover:bg-muted disabled:pointer-events-none disabled:opacity-40")}
    >
      <ChevronLeft size={18} />
    </button>
    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
      <button
        key={p}
        type="button"
        onClick={() => onChange(p)}
        aria-current={p === page ? "page" : undefined}
        className={cn(pageButton, p === page ? "bg-primary text-white" : "hover:bg-muted")}
      >
        {p}
      </button>
    ))}
    <button
      type="button"
      disabled={page === pages}
      onClick={() => onChange(page + 1)}
      aria-label="Next page"
      className={cn(pageButton, "hover:bg-muted disabled:pointer-events-none disabled:opacity-40")}
    >
      <ChevronRight size={18} />
    </button>
  </nav>
);

export default Restaurants;
