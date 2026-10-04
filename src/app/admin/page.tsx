"use client";

import React from "react";
import Link from "next/link";
import { Armchair, CalendarCheck, CircleCheck, MapPinOff, Plus, Store } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RestaurantImage from "@/components/shared/RestaurantImage";
import Status from "@/components/shared/Status";
import { Restaurant, errorMessage, hasLocation, useDeleteRestaurant, useRestaurants } from "@/lib/restaurants";
import { Booking, isUpcoming, timeRange, useAllBookings, useCancelBooking } from "@/lib/bookings";
import { formatDate } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

const tab = "h-8 px-4 data-active:bg-card";

const RestaurantRow = ({ restaurant: r }: { restaurant: Restaurant }) => {
  const remove = useDeleteRestaurant();

  const onDelete = () => {
    if (confirm(`Delete ${r.name}? Its tables and bookings will be deleted too.`)) remove.mutate(r.id);
  };

  return (
    <div className="surface flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
      <RestaurantImage src={r.image} alt={r.name} width={48} height={48} className="size-12 rounded-xl object-cover" />
      <div className="min-w-0 flex-1 basis-40 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold">{r.name}</p>
          {r.cuisine && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.cuisine}</span>}
          <Status type={r.availableToday ? "available" : "booked"} />
          {!hasLocation(r) && (
            <span className="flex items-center gap-1 text-xs text-orange" title="Set the location in the edit form">
              <MapPinOff size={12} /> No location
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {r.address} · {r.tablesCount} tables · {formatPrice(r.priceMin, r.priceMax)}
        </p>
        {remove.error && <p className="text-xs text-destructive">Delete failed: {errorMessage(remove.error)}</p>}
      </div>
      {/* on phones the actions get their own full-width row */}
      <div className="flex w-full gap-2 sm:w-auto">
        <Link href={`/edit?id=${r.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1 rounded-lg sm:flex-none" })}>
          Edit
        </Link>
        <Button variant="destructive" size="sm" className="flex-1 rounded-lg sm:flex-none" disabled={remove.isPending} onClick={onDelete}>
          {remove.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
};

const BookingRow = ({ booking: b }: { booking: Booking }) => {
  const cancel = useCancelBooking();

  const onCancel = () => {
    if (confirm(`Cancel ${b.code} for ${b.user.name} at ${b.restaurantName}?`)) cancel.mutate(b.id);
  };

  return (
    <tr>
      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{b.code}</td>
      <td className="px-5 py-4 font-medium">{b.restaurantName}</td>
      <td className="px-5 py-4">
        <p>{b.user.name}</p>
        <p className="text-xs text-muted-foreground">{b.user.email}</p>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        {formatDate(b.date)} · {timeRange(b)}
      </td>
      <td className="px-5 py-4">#{b.tableNumber}</td>
      <td className="px-5 py-4">{b.guests}</td>
      <td className="px-5 py-4">
        <Status type={b.status.toLowerCase() as Lowercase<Booking["status"]>} pill />
        {cancel.error && <p className="mt-1 text-xs text-destructive">{errorMessage(cancel.error)}</p>}
      </td>
      <td className="px-5 py-4 text-right">
        {isUpcoming(b) && (
          <Button variant="outline" size="sm" className="rounded-lg" disabled={cancel.isPending} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </td>
    </tr>
  );
};

const Page = () => {
  const { data: restaurants = [], isPending, error } = useRestaurants();
  const { data: bookings = [], isPending: bookingsPending, error: bookingsError } = useAllBookings();

  const stats = [
    { icon: Store, label: "Total restaurants", value: restaurants.length },
    { icon: CalendarCheck, label: "Active bookings", value: bookings.filter(isUpcoming).length },
    { icon: CircleCheck, label: "Available today", value: restaurants.filter((r) => r.availableToday).length },
    { icon: Armchair, label: "Total tables", value: restaurants.reduce((sum, r) => sum + r.tablesCount, 0) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="caption">Admin dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Restaurant Management</h1>
        </div>
        <Link href="/edit" className={buttonVariants({ className: "h-10 rounded-xl px-4" })}>
          <Plus /> New Restaurant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="surface p-4 sm:p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold sm:mt-4 sm:text-3xl">{isPending || bookingsPending ? "–" : value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="restaurants" className="gap-4">
        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="restaurants" className={tab}>
            Restaurants ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className={tab}>
            Bookings ({bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="space-y-3">
          {error && <p className="surface p-6 text-center text-sm text-destructive">Could not load restaurants: {errorMessage(error)}</p>}
          {isPending && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-3xl" />)}
          {!isPending && !error && !restaurants.length && (
            <p className="surface p-6 text-center text-sm text-muted-foreground">No restaurants yet — create the first one</p>
          )}
          {restaurants.map((r) => (
            <RestaurantRow key={r.id} restaurant={r} />
          ))}
        </TabsContent>

        <TabsContent value="bookings">
          <div className="surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  {["Code", "Restaurant", "Guest", "Date · Time", "Table", "Guests", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(bookingsError || bookingsPending || !bookings.length) && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                      {bookingsError
                        ? `Could not load bookings: ${errorMessage(bookingsError)}`
                        : bookingsPending
                          ? "Loading bookings..."
                          : "No bookings yet"}
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
