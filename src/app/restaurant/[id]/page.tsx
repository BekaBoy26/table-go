"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, Loader2, Mail, MapPin, Phone, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import BackLink from "@/components/shared/BackLink";
import FavoriteButton from "@/components/shared/FavoriteButton";
import RestaurantImage from "@/components/shared/RestaurantImage";
import Status from "@/components/shared/Status";
import Tags from "@/components/shared/Tags";
import TableAvailability from "@/components/pages/restaurant/TableAvailability";
import { gisUrl, useRestaurant } from "@/lib/restaurants";
import { formatPrice } from "@/lib/utils";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: r, isPending } = useRestaurant(id);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> Loading...
      </div>
    );
  }
  if (!r) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink href="/" label="Back to restaurants" />
        <p className="surface p-8 text-center text-muted-foreground">Restaurant not found</p>
      </div>
    );
  }

  const mapUrl = gisUrl(r);
  const info = [
    { icon: Clock, label: "Hours", value: r.workTime },
    { icon: MapPin, label: "Address", value: r.address, href: mapUrl },
    { icon: Phone, label: "Phone", value: r.phone, href: r.phone && `tel:${r.phone.replace(/[^\d+]/g, "")}` },
    { icon: Mail, label: "Email", value: r.email, href: r.email && `mailto:${r.email}` },
  ].filter((i) => i.value);

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/" label="Back to restaurants" />

      <div className="surface overflow-hidden">
        <div className="relative h-56 sm:h-72 md:h-96">
          <RestaurantImage src={r.image} alt={r.name} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
        </div>

        <div className="space-y-6 p-5 sm:space-y-8 sm:p-8">
          <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{r.name}</h1>
              <p className="text-muted-foreground">{[r.cuisine, "Bishkek"].filter(Boolean).join(" · ")}</p>
              <p className="flex items-center gap-2 font-medium">
                <Wallet size={16} className="text-orange" />
                {formatPrice(r.priceMin, r.priceMax)}
              </p>
              <Tags tags={r.tags} />
            </div>
            <div className="flex items-center gap-3">
              <Status type={r.availableToday ? "available" : "booked"} pill />
              <FavoriteButton id={r.id} className="size-9 ring-1 ring-border" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            <div>
              <h2 className="mb-2 font-semibold">About</h2>
              <p className="leading-relaxed text-muted-foreground">{r.description || "No description yet."}</p>
            </div>
            <ul className="space-y-4">
              {info.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}
                        className="text-sm font-medium break-all hover:text-primary hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-border sm:h-40"
          >
            <MapPin className="text-primary" />
            {r.address}
            <span className="font-medium text-primary">Open in 2GIS →</span>
          </a>

          <TableAvailability restaurantId={r.id} />

          <Link href={`/restaurant/${r.id}/book`} className={buttonVariants({ className: "sticky bottom-4 h-12 w-full rounded-xl text-base shadow-lg sm:static sm:shadow-none" })}>
            Reserve Table
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
