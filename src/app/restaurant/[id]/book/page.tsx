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
import { BOOKING_WINDOW_DAYS, Booking, MAX_GUESTS, useAvailability, useCreateBooking } from "@/lib/bookings";
import { formatDate, toISODate } from "@/lib/data";
import { Restaurant, errorMessage, useRestaurant } from "@/lib/restaurants";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const steps = ["Guests", "Date", "Time", "Summary"];

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
  // ?date= and ?time= come from the table grid on the restaurant page, ?guests= from it or AI search
  const presetDate = params.get("date");
  const presetTime = params.get("time") ?? "";
  const presetGuests = Number(params.get("guests"));
  // computed on mount, not on import, so a tab left open overnight still starts today
  const [days] = useState(() => Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(new Date(), i)));

  const [step, setStep] = useState(0);
  // one party sits at one table, so the biggest table caps the party size
  const maxGuests = Math.min(MAX_GUESTS, r.maxSeats || MAX_GUESTS);
  const [guests, setGuests] = useState(
    presetGuests >= 1 ? Math.min(maxGuests, Math.round(presetGuests)) : Math.min(2, maxGuests),
  );
  const [date, setDate] = useState(
    () =>
      days.find((d) => toISODate(d) === presetDate) ??
      // no free table left today: start from tomorrow
      (!r.availableToday && !presetTime ? days[1] : days[0]),
  );
  const [time, setTime] = useState(presetTime);
  const [note, setNote] = useState("");
  const create = useCreateBooking();

  const slots = useAvailability(r.id, toISODate(date), guests);
  const timeOk = !!slots.data?.find((s) => s.time === time)?.available;
  const noSlots = slots.data?.every((s) => !s.available);
  // someone else took the chosen time while this page was open (pushed over the socket)
  const timeTaken = !!time && !!slots.data && !timeOk;

  if (create.data) return <Confirmed booking={create.data} address={r.address} />;

  const summary = [
    ["Restaurant", r.name],
    ["Date", formatDate(toISODate(date))],
    ["Time", time],
    ["Guests", `${guests} ${guests === 1 ? "guest" : "guests"}`],
  ];

  const canNext = step < 2 || timeOk;
  const confirm = () => create.mutate({ restaurantId: r.id, date: toISODate(date), time, guests, note: note.trim() || undefined });
  const next = () => (step < 3 ? setStep(step + 1) : confirm());

  return (
    <div className="mx-auto max-w-xl">
      <BackLink href={`/restaurant/${r.id}`} />

      <div className="mb-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-sm font-medium",
                i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            {/* on phones only the current step keeps its label */}
            <span className={cn("text-sm", i === step ? "font-medium" : "hidden text-muted-foreground sm:inline")}>{s}</span>
            {i < 3 && <span className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      <div className="surface space-y-6 p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b pb-6">
          <RestaurantImage src={r.image} alt={r.name} width={48} height={48} className="size-12 rounded-xl object-cover" />
          <div>
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-muted-foreground">{[r.cuisine, "Bishkek"].filter(Boolean).join(" · ")}</p>
          </div>
        </div>

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">How many guests?</h2>
            <div className="flex items-center justify-center gap-8 py-4">
              <Button variant="outline" size="icon-lg" className="rounded-full" onClick={() => setGuests(Math.max(1, guests - 1))}>
                <Minus />
              </Button>
              <span className="w-12 text-center text-5xl font-bold">{guests}</span>
              <Button variant="outline" size="icon-lg" className="rounded-full" disabled={guests >= maxGuests} onClick={() => setGuests(Math.min(maxGuests, guests + 1))}>
                <Plus />
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {maxGuests < MAX_GUESTS
                ? `The biggest table here seats ${maxGuests} — for a larger group, look for restaurants marked "Large group".`
                : `Maximum ${MAX_GUESTS} guests per reservation`}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">Select a date</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {days.map((d) => {
                const closed = isToday(d) && !r.availableToday;
                return (
                  <button
                    key={d.toISOString()}
                    disabled={closed}
                    title={closed ? "No free tables left today" : undefined}
                    onClick={() => setDate(d)}
                    className={cn(
                      "rounded-xl border py-2 text-center transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:line-through",
                      toISODate(d) === toISODate(date) ? "border-primary bg-primary text-white" : "enabled:hover:border-primary",
                    )}
                  >
                    <p className="text-xs opacity-70">{format(d, "EEE")}</p>
                    <p className="font-semibold">{format(d, "d")}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">Select a time</h2>
            {slots.error ? (
              <p className="text-sm text-destructive">Could not load free times: {errorMessage(slots.error)}</p>
            ) : slots.isPending ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                {timeTaken && !noSlots && (
                  <p className="text-sm text-destructive">{time} is no longer available — please pick another time.</p>
                )}
                {noSlots && (
                  <p className="text-sm text-muted-foreground">
                    No free tables for {guests} on {formatDate(toISODate(date))} — try another day.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.data.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setTime(s.time)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:line-through",
                        s.time === time && s.available ? "border-primary bg-primary text-white" : "enabled:hover:border-primary",
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">Confirm your booking</h2>
            <div className="space-y-3 rounded-2xl bg-muted p-5 text-sm">
              <SummaryRows rows={summary} />
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Special requests (optional)"
              className="min-h-24 rounded-xl"
            />
            {timeTaken && !create.error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Someone just booked the last table at {time}.{" "}
                <button type="button" className="font-medium underline" onClick={() => setStep(2)}>
                  Pick another time
                </button>
              </p>
            )}
            {create.error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage(create.error)}</p>
            )}
          </>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => {
                create.reset();
                setStep(step - 1);
              }}
            >
              Back
            </Button>
          )}
          <Button className="h-11 flex-1 rounded-xl" disabled={!canNext || create.isPending} onClick={next}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {step < 3 ? "Continue" : "Confirm Reservation"}
          </Button>
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
  // a dinner slot is blocked for about two hours
  const start = new Date(`${b.date}T${b.time}`);
  const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Table at ${b.restaurantName}`,
  )}&dates=${stamp(start)}/${stamp(addHours(start, 2))}&details=${encodeURIComponent(
    `Reservation ${b.code}, table #${b.tableNumber}, ${b.guests} guests`,
  )}&location=${encodeURIComponent(`${address}, Bishkek`)}`;

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
            ["Time", b.time],
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
