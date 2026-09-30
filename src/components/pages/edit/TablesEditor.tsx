"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_GUESTS } from "@/lib/bookings";
import { errorMessage } from "@/lib/restaurants";
import { Table, useAddTable, useDeleteTable, useTables, useUpdateTable } from "@/lib/tables";

const capacities = Array.from({ length: MAX_GUESTS }, (_, i) => i + 1);
const select = "h-8 rounded-lg border bg-background px-2 text-sm";

const TableRow = ({ restaurantId, table: t }: { restaurantId: string; table: Table }) => {
  const update = useUpdateTable(restaurantId);
  const remove = useDeleteTable(restaurantId);
  const error = update.error ?? remove.error;

  const onDelete = () => {
    if (confirm(`Delete table #${t.number}?`)) remove.mutate(t.id);
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-2">
      <span className="w-10 font-medium">#{t.number}</span>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Seats
        <select
          value={t.capacity}
          disabled={update.isPending}
          onChange={(e) => update.mutate({ id: t.id, capacity: Number(e.target.value) })}
          className={select}
        >
          {capacities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm" title="Switched off tables don't get new bookings">
        <input
          type="checkbox"
          checked={t.isAvailable}
          disabled={update.isPending}
          onChange={(e) => update.mutate({ id: t.id, isAvailable: e.target.checked })}
          className="size-4 accent-primary"
        />
        In use
      </label>
      {t.upcomingBookings > 0 && (
        <span className="text-xs text-muted-foreground">
          {t.upcomingBookings} upcoming {t.upcomingBookings === 1 ? "booking" : "bookings"}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="ml-auto text-destructive"
        aria-label={`Delete table #${t.number}`}
        disabled={remove.isPending}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
      {error && <p className="w-full text-xs text-destructive">{errorMessage(error)}</p>}
    </li>
  );
};

/** Admin list of a restaurant's tables: seats, on/off, add and delete. */
const TablesEditor = ({ restaurantId }: { restaurantId: string }) => {
  const { data: tables = [], isPending, error } = useTables(restaurantId);
  const add = useAddTable(restaurantId);
  const [capacity, setCapacity] = useState(4);

  return (
    <div className="sm:col-span-2 space-y-2">
      <span className="caption">Tables ({tables.length})</span>
      <div className="rounded-xl p-4 ring-1 ring-border">
        {error ? (
          <p className="text-sm text-destructive">Could not load tables: {errorMessage(error)}</p>
        ) : isPending ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !tables.length ? (
          <p className="text-sm text-orange">No tables yet — guests can&apos;t book until you add some.</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {tables.map((t) => (
              <TableRow key={t.id} restaurantId={restaurantId} table={t} />
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            New table, seats
            <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={select}>
              {capacities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={add.isPending} onClick={() => add.mutate(capacity)}>
            <Plus /> Add table
          </Button>
          {add.error && <p className="text-xs text-destructive">{errorMessage(add.error)}</p>}
        </div>
      </div>
    </div>
  );
};

export default TablesEditor;
