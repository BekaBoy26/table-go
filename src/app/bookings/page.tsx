"use client";

import React from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import BookingCard from "@/components/shared/BookingCard";
import SignInPrompt from "@/components/shared/SignInPrompt";
import { Booking, isPast, useMyBookings } from "@/lib/bookings";
import { errorMessage } from "@/lib/restaurants";
import { useStore } from "@/lib/store";

const byStart = (a: Booking, b: Booking) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);

const Page = () => {
  const token = useStore((s) => s.token);
  const { data: bookings = [], isPending, error } = useMyBookings();

  if (!token) return <SignInPrompt title="Sign in to see your bookings" text="Your reservations are saved to your account." />;

  const groups = [
    { title: "Upcoming", list: bookings.filter((b) => !isPast(b)).sort(byStart), empty: "No upcoming reservations" },
    // most recent first
    { title: "Past", list: bookings.filter(isPast).sort((a, b) => byStart(b, a)), empty: "No past reservations" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Bookings</h1>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Browse restaurants →
        </Link>
      </div>

      {error ? (
        <p className="surface p-6 text-center text-sm text-destructive">Could not load bookings: {errorMessage(error)}</p>
      ) : isPending ? (
        Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)
      ) : (
        groups.map((g) => (
          <section key={g.title} className="space-y-3">
            <h2 className="caption">{g.title}</h2>
            {g.list.length ? (
              g.list.map((b) => <BookingCard key={b.id} booking={b} />)
            ) : (
              <p className="surface p-6 text-center text-sm text-muted-foreground">{g.empty}</p>
            )}
          </section>
        ))
      )}
    </div>
  );
};

export default Page;
