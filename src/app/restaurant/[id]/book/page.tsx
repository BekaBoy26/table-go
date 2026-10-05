"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { addDays, addHours, format, isToday } from "date-fns";
import { Check, CalendarPlus, Loader2, Minus, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import BackLink from "@/components/shared/BackLink";
import RestaurantImage from "@/components/shared/RestaurantImage";
import SignInPrompt from "@/components/shared/SignInPrompt";
import { BOOKING_WINDOW_DAYS, Booking, MAX_GUESTS, MAX_HOURS, Occupancy, timeRange, useCreateBooking, useOccupancy } from "@/lib/bookings";
import { formatDate, toISODate } from "@/lib/data";
import { Restaurant, errorMessage, useRestaurant } from "@/lib/restaurants";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Table = Occupancy["tables"][number];

const choice = "rounded-xl border text-center transition-colors disabled:bg-muted disabled:text-muted-foreground";
const chosen = (on: boolean) => (on ? "border-primary bg-primary text-white" : "enabled:hover:border-primary");

const Stepper = ({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) => (
  <div className="flex items-center gap-4">
    <Button variant="outline" size="icon" className="rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)}>
      <Minus />
    </Button>
    <span className="min-w-20 text-center text-lg font-semibold">{label}</span>
    <Button variant="outline" size="icon" className="rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)}>
      <Plus />
    </Button>
  </div>
);

const Field = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-semibold">{title}</h2>
    {children}
  </section>
);

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: r } = useRestaurant(id);
  const token = useStore((s) => s.token);

  if (!r) return null;
  if (!token) {
    return <SignInPrompt title={`Sign in to book ${r.name}`} text="Your reservation is saved to your account so you can manage it later." />;
  }
  return <BookingFlow r={r} />;
};

const BookingFlow = ({ r }: { r: Restaurant }) => {
  const params = useSearchParams();
  // ?date=, ?time= and ?table= come from the table grid on the restaurant page, ?guests= from it or AI search
  const presetGuests = Number(params.get("guests"));
  // computed on mount, not on import, so a tab left open overnight still starts today
  const [days] = useState(() => Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => toISODate(addDays(new Date(), i))));

  // one party sits at one table, so the biggest table caps the party size
  const maxGuests = Math.min(MAX_GUESTS, r.maxSeats || MAX_GUESTS);
  const [guests, setGuests] = useState(
    presetGuests >= 1 ? Math.min(maxGuests, Math.round(presetGuests)) : Math.min(2, maxGuests),
  );
  const [date, setDate] = useState(() => {
    const preset = params.get("date");
    if (preset && days.includes(preset)) return preset;
    // no free table left today: start from tomorrow
    return r.availableToday ? days[0] : days[1];
  });
  const [time, setTime] = useState(params.get("time") ?? "");
  const [hours, setHours] = useState(1);
  const [tableId, setTableId] = useState(params.get("table") ?? "");
  const [note, setNote] = useState("");
  const create = useCreateBooking();

  const occupancy = useOccupancy(r.id, date);
  // the previous day's grid is kept as placeholder while switching days; don't book from it
  const data = occupancy.isPlaceholderData ? undefined : occupancy.data;
  const times = data?.times ?? [];
  const closed = new Set(data?.closed);

  /** The table is free for `n` hours from `start`, all within working hours. */
  const freeFor = (tb: Table, start: string, n: number) => {
    const i = times.indexOf(start);
    if (!tb.isAvailable || i < 0 || i + n > times.length) return false;
    return times.slice(i, i + n).every((t) => !closed.has(t) && !tb.booked.includes(t));
  };
  const tables = data?.tables ?? [];
  const fitting = tables.filter((tb) => tb.capacity >= guests);
  const maxHours = time && times.includes(time) ? Math.min(MAX_HOURS, times.length - times.indexOf(time)) : MAX_HOURS;
  const length = Math.min(hours, maxHours);
  const table = fitting.find((tb) => tb.id === tableId && freeFor(tb, time, length));

  if (create.data) return <Confirmed booking={create.data} address={r.address} />;

  const confirm = () =>
    table && create.mutate({ restaurantId: r.id, tableId: table.id, date, time, hours: length, guests, note: note.trim() || undefined });

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href={`/restaurant/${r.id}`} />

      <div className="surface space-y-6 p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b pb-6">
          <RestaurantImage src={r.image} alt={r.name} width={48} height={48} className="size-12 rounded-xl object-cover" />
          <div>
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-muted-foreground">{[r.cuisine, r.workTime].filter(Boolean).join(" · ")}</p>
          </div>
        </div>

        <Field title="Guests">
          <Stepper value={guests} min={1} max={maxGuests} onChange={setGuests} label={`${guests} ${guests === 1 ? "guest" : "guests"}`} />
        </Field>

        <Field title="Date">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d) => {
              const day = new Date(`${d}T00:00`);
              const off = isToday(day) && !r.availableToday;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={off}
                  title={off ? "No free tables left today" : undefined}
                  onClick={() => setDate(d)}
                  className={cn(choice, "shrink-0 px-3 py-1.5 disabled:line-through", chosen(d === date))}
                >
                  <span className="block text-[11px] opacity-70">{isToday(day) ? "Today" : format(day, "EEE")}</span>
                  <span className="block text-sm font-semibold">{format(day, "MMM d")}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {occupancy.error ? (
          <p className="text-sm text-destructive">Could not load free tables: {errorMessage(occupancy.error)}</p>
        ) : !data ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <>
            <Field title="Time">
              {closed.size === times.length ? (
                <p className="text-sm text-muted-foreground">Booking for {formatDate(date)} is closed — pick another day.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={!fitting.some((tb) => freeFor(tb, t, 1))}
                      onClick={() => setTime(t)}
                      className={cn(choice, "py-2 text-sm font-medium disabled:line-through", chosen(t === time))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field title="How long?">
              <Stepper value={length} min={1} max={maxHours} onChange={setHours} label={`${length} ${length === 1 ? "hour" : "hours"}`} />
            </Field>

            <Field title="Table">
              {!tables.length ? (
                <p className="text-sm text-muted-foreground">This restaurant hasn&apos;t added its tables yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {tables.map((tb) => {
                    const small = tb.capacity < guests;
                    const free = !!time && freeFor(tb, time, length);
                    return (
                      <button
                        key={tb.id}
                        type="button"
                        disabled={small || !free}
                        onClick={() => setTableId(tb.id)}
                        className={cn(choice, "px-3 py-2.5", time && "disabled:line-through", chosen(tb.id === table?.id))}
                      >
                        <span className="block font-semibold">Table #{tb.number}</span>
                        <span className="block text-xs opacity-70">
                          {small ? `Only ${tb.capacity} seats` : !time ? `${tb.capacity} seats` : free ? `${tb.capacity} seats · free` : "Booked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
          </>
        )}

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Special requests (optional)"
          className="min-h-20 rounded-xl"
        />

        {create.error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage(create.error)}</p>}

        <div className="space-y-2">
          <Button className="h-11 w-full rounded-xl" disabled={!table || create.isPending} onClick={confirm}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {table ? `Book table #${table.number} · ${formatDate(date)} · ${timeRange({ time, hours: length })}` : "Book a table"}
          </Button>
          {!table && (
            <p className="text-center text-xs text-muted-foreground">{!time ? "Choose a time and a table" : "Choose a free table"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRows = ({ rows }: { rows: string[][] }) =>
  rows.map(([k, v]) => (
    <div key={k} className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <b>{v}</b>
    </div>
  ));

const Confirmed = ({ booking: b, address }: { booking: Booking; address: string }) => {
  // wall-clock time; ctz below tells Google Calendar it is Bishkek time
  const start = new Date(`${b.date}T${b.time}`);
  const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Table at ${b.restaurantName}`,
  )}&dates=${stamp(start)}/${stamp(addHours(start, b.hours))}&details=${encodeURIComponent(
    `Reservation ${b.code}, table #${b.tableNumber}, ${b.guests} guests`,
  )}&location=${encodeURIComponent(`${address}, Bishkek`)}&ctz=Asia/Bishkek`;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <span className="mb-6 grid size-16 place-items-center rounded-full bg-success/10 text-success">
        <Check size={32} />
      </span>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Booking confirmed!</h1>
      <p className="mt-2 text-muted-foreground">Your table has been reserved. See you soon!</p>

      <div className="surface mt-8 w-full space-y-3 p-6 text-left text-sm">
        <SummaryRows
          rows={[
            ["Restaurant", b.restaurantName],
            ["Date", formatDate(b.date)],
            ["Time", timeRange(b)],
            ["Guests", `${b.guests} ${b.guests === 1 ? "guest" : "guests"}`],
            ["Table", `#${b.tableNumber}`],
          ]}
        />
        <div className="mt-4 rounded-2xl bg-muted py-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Reservation code</p>
          <p className="font-mono text-2xl font-bold tracking-widest">{b.code}</p>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col gap-3">
        <a href={calendarUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", className: "h-11 rounded-xl" })}>
          <CalendarPlus /> Add to calendar
        </a>
        <Link href="/bookings" className={buttonVariants({ className: "h-11 rounded-xl" })}>
          View my bookings
        </Link>
      </div>
    </div>
  );
};

export default Page;
