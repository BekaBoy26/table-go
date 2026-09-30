import React from "react";
import Link from "next/link";
import { Users, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Restaurant } from "@/lib/restaurants";
import { formatPrice } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import RestaurantImage from "./RestaurantImage";
import Status from "./Status";
import Tags from "./Tags";

const RestaurantCard = ({ restaurant: r }: { restaurant: Restaurant }) => {
  return (
    <div className="surface group flex flex-col overflow-hidden">
      <div className="relative aspect-[3/2] overflow-hidden">
        <RestaurantImage
          src={r.image}
          alt={r.name}
          fill
          sizes="(max-width: 1280px) 50vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <FavoriteButton id={r.id} className="absolute top-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold">{r.name}</h3>
          <p className="text-sm text-muted-foreground">{[r.cuisine, "Bishkek"].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          <p className="flex items-center gap-2">
            <Wallet size={16} className="text-orange" />
            {formatPrice(r.priceMin, r.priceMax)}
          </p>
          {r.maxSeats > 0 && (
            <p className="flex items-center gap-2" title="Biggest table">
              <Users size={16} className="text-orange" />
              Up to {r.maxSeats} guests
            </p>
          )}
        </div>
        <Tags tags={r.tags} />
        <div className="mt-auto pt-2">
          <Status type={r.availableToday ? "available" : "booked"} />
        </div>
        <Link href={`/restaurant/${r.id}`} className={buttonVariants({ size: "lg", className: "h-10 rounded-xl" })}>
          View restaurant
        </Link>
      </div>
    </div>
  );
};

export default RestaurantCard;
