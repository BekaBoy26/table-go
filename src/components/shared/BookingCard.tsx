"use client";

import React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Booking, isUpcoming, timeRange, useCancelBooking } from "@/lib/bookings";
import { formatDate } from "@/lib/data";
import { errorMessage } from "@/lib/restaurants";
import RestaurantImage from "./RestaurantImage";
import Status from "./Status";

const BookingCard = ({ booking: b }: { booking: Booking }) => {
  const cancel = useCancelBooking();

  const stats = [
    ["Table", `#${b.tableNumber}`],
    ["Date · Time", `${formatDate(b.date)} · ${timeRange(b)}`],
    ["Guests", b.guests],
  ];

  const onCancel = () => {
    if (confirm(`Cancel your table at ${b.restaurantName} on ${formatDate(b.date)} at ${b.time}?`)) cancel.mutate(b.id);
  };

  return (
    <div className="surface space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <RestaurantImage src={b.restaurantImage} alt={b.restaurantName} width={44} height={44} className="size-11 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{b.restaurantName}</p>
          <p className="font-mono text-xs text-muted-foreground">{b.code}</p>
        </div>
        <Status type={b.status.toLowerCase() as Lowercase<Booking["status"]>} pill />
      </div>

      <div className="grid grid-cols-3 divide-x rounded-2xl bg-muted px-1 py-3 text-center">
        {stats.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="text-xs font-semibold sm:text-sm">{v}</p>
          </div>
        ))}
      </div>

      {b.note && <p className="text-sm text-muted-foreground">“{b.note}”</p>}

      {cancel.error && <p className="text-sm text-destructive">Could not cancel: {errorMessage(cancel.error)}</p>}

      {isUpcoming(b) && (
        <div className="flex gap-3">
          <Link href={`/restaurant/${b.restaurantId}`} className={buttonVariants({ variant: "outline", className: "h-9 flex-1 rounded-xl" })}>
            View details
          </Link>
          <Button variant="destructive" className="h-9 flex-1 rounded-xl" disabled={cancel.isPending} onClick={onCancel}>
            {cancel.isPending ? "Cancelling..." : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
