"use client";

import React, { useState } from "react";
import Link from "next/link";
import { addDays, format, isToday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOKING_WINDOW_DAYS, useOccupancy } from "@/lib/bookings";
import { toISODate } from "@/lib/data";
import { useLive } from "@/lib/realtime";
import { errorMessage } from "@/lib/restaurants";
import { cn } from "@/lib/utils";

const cell = "grid h-9 min-w-12 place-items-center rounded-lg text-xs font-medium transition-colors duration-500";

const legend = [
  { label: "Free", className: "bg-success/15" },
  { label: "Booked", className: "bg-destructive/15" },
  { label: "Unavailable", className: "bg-muted" },
];

const LiveBadge = () => {
  const live = useLive();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        live ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
      )}
      title={live ? "Updates the moment someone books or cancels" : "Reconnecting — the grid may be out of date"}
    >
      <span className="relative flex size-2">
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
      {live ? "Live" : "Offline"}
    </span>
  );
};

/**
 * Every table × every slot of a day: free, booked or unavailable, updated in real
 * time over the socket. A free cell starts booking at that time.
 */
const TableAvailability = ({ restaurantId }: { restaurantId: string }) => {
  const [days] = useState(() => Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(new Date(), i)));
  const [date, setDate] = useState(() => toISODate(days[0]));
  const { data, isPending, isPlaceholderData, error } = useOccupancy(restaurantId, date);

  const tables = data?.tables ?? [];
  const closed = new Set(data?.closed);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Table availability</h2>
        <LiveBadge />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((d) => {
          const iso = toISODate(d);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setDate(iso)}
              aria-pressed={iso === date}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-1.5 text-center transition-colors",
                iso === date ? "border-primary bg-primary text-white" : "hover:border-primary",
              )}
            >
              <span className="block text-[11px] opacity-70">{isToday(d) ? "Today" : format(d, "EEE")}</span>
              <span className="block text-sm font-semibold">{format(d, "MMM d")}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">Could not load tables: {errorMessage(error)}</p>
      ) : isPending ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : !tables.length ? (
        <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">This restaurant hasn&apos;t added its tables yet.</p>
      ) : (
        <>
          {closed.size === data.times.length && (
            <p className="text-sm text-muted-foreground">Booking for this day is closed — pick another day.</p>
          )}
          <div className={cn("overflow-x-auto rounded-2xl ring-1 ring-border transition-opacity", isPlaceholderData && "opacity-60")}>
            <table className="w-full border-separate border-spacing-1 p-1 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card px-2 text-left text-xs font-medium text-muted-foreground">Table</th>
                  {data.times.map((t) => (
                    <th key={t} className="px-1 text-xs font-medium text-muted-foreground">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map((tb) => (
                  <tr key={tb.id}>
                    <th scope="row" className="sticky left-0 z-10 bg-card px-2 text-left font-medium whitespace-nowrap">
                      #{tb.number} <span className="text-xs font-normal text-muted-foreground">· {tb.capacity} seats</span>
                    </th>
                    {data.times.map((t) => {
                      const booked = tb.booked.includes(t);
                      if (!tb.isAvailable || closed.has(t)) {
                        return (
                          <td key={t}>
                            <span className={cn(cell, "bg-muted text-muted-foreground/60")} title={tb.isAvailable ? "Can't be booked any more" : "Table not in use"}>
                              {booked ? "Booked" : "—"}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={t}>
                          {booked ? (
                            <span className={cn(cell, "bg-destructive/15 text-destructive")} title={`Table #${tb.number} is booked at ${t}`}>
                              Booked
                            </span>
                          ) : (
                            <Link
                              href={`/restaurant/${restaurantId}/book?date=${date}&time=${t}&guests=${Math.min(2, tb.capacity)}`}
                              className={cn(cell, "bg-success/15 text-success hover:bg-success/25")}
                              title={`Table #${tb.number} is free at ${t} — book`}
                            >
                              Free
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded", l.className)} /> {l.label}
              </span>
            ))}
            <span className="ml-auto">Tap a free slot to book it</span>
          </div>
        </>
      )}
    </section>
  );
};

export default TableAvailability;
