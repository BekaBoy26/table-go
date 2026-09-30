"use client";

import React from "react";
import Link from "next/link";
import BookingCard from "@/components/shared/BookingCard";
import FavoriteButton from "@/components/shared/FavoriteButton";
import RestaurantImage from "@/components/shared/RestaurantImage";
import SignInPrompt from "@/components/shared/SignInPrompt";
import { isUpcoming, useMyBookings } from "@/lib/bookings";
import { useFavorites } from "@/lib/favorites";
import { useRestaurants } from "@/lib/restaurants";
import ProfileForm from "@/components/pages/profile/ProfileForm";
import Settings from "@/components/pages/profile/Settings";
import { useStore } from "@/lib/store";

const Page = () => {
  const { user, token } = useStore();
  const { data: restaurants = [] } = useRestaurants();
  const { data: bookings = [] } = useMyBookings();
  const ids = useFavorites();
  const upcoming = bookings.filter(isUpcoming);

  if (!token) {
    return <SignInPrompt title="Sign in to see your profile" text="Your bookings, favorites and contact details live here." />;
  }
  const favorites = restaurants.filter((r) => ids.includes(r.id));

  const stats = [
    ["Bookings", bookings.length],
    ["Upcoming", upcoming.length],
    ["Favorites", favorites.length],
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="surface w-full shrink-0 p-6 text-center lg:sticky lg:top-24 lg:w-72">
        <div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google avatars break next/image referrer checks
            <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            user.name[0]?.toUpperCase()
          )}
        </div>
        <h1 className="mt-4 text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 border-t pt-6">
          {stats.map(([k, v]) => (
            <div key={k}>
              <p className="text-xl font-bold">{v}</p>
              <p className="text-xs text-muted-foreground">{k}</p>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-8 lg:space-y-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming reservations</h2>
            <Link href="/bookings" className="text-sm font-medium text-primary hover:underline">
              All bookings →
            </Link>
          </div>
          {upcoming.length ? (
            upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
          ) : (
            <p className="surface p-6 text-center text-sm text-muted-foreground">No upcoming reservations</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Favorite restaurants</h2>
          {!favorites.length && (
            <p className="surface p-6 text-center text-sm text-muted-foreground">Tap the heart on a restaurant to save it here</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {favorites.map((r) => (
              <Link key={r.id} href={`/restaurant/${r.id}`} className="surface group overflow-hidden">
                <div className="relative h-28">
                  <RestaurantImage src={r.image} alt={r.name} fill sizes="240px" className="object-cover" />
                  <FavoriteButton id={r.id} className="absolute top-2 right-2" />
                </div>
                <div className="p-3">
                  <p className="font-medium group-hover:text-primary">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.cuisine}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <ProfileForm />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Settings />
        </section>
      </div>
    </div>
  );
};

export default Page;
