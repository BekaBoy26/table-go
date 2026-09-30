"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LatLng, LocationPicker } from "@/components/map";
import { Restaurant, RestaurantInput, errorMessage, useRestaurant, useSaveRestaurant } from "@/lib/restaurants";
import { CUISINES, TAGS } from "@/lib/data";
import ChipPicker from "./ChipPicker";
import PlaceSearch, { Place } from "./PlaceSearch";
import TablesEditor from "./TablesEditor";

const fields = [
  { name: "name", label: "Restaurant name", placeholder: "Bella Italia", required: true },
  { name: "address", label: "Address", placeholder: "Chuy Avenue 123", required: true },
  { name: "gisAddress", label: "Address in 2GIS (Russian)", placeholder: "проспект Чуй, 123" },
  { name: "workTime", label: "Opening hours", placeholder: "Mon–Sun: 12:00–23:00" },
  { name: "priceMin", label: "Min price (KGS)", placeholder: "1000", type: "number" },
  { name: "priceMax", label: "Max price (KGS)", placeholder: "5000", type: "number" },
  { name: "phone", label: "Phone", placeholder: "+996 312 456 789", type: "tel" },
  { name: "email", label: "Email", placeholder: "hello@restaurant.kg", type: "email" },
  { name: "image", label: "Image URL", placeholder: "https://...", type: "url" },
  { name: "gisLink", label: "2GIS link", placeholder: "https://2gis.kg/bishkek/...", type: "url" },
] as const;

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null;
const int = (v: FormDataEntryValue | null) => (text(v) === null ? null : Number(v));

const Form = ({ restaurant }: { restaurant?: Restaurant }) => {
  const router = useRouter();
  const save = useSaveRestaurant();
  const [cuisine, setCuisine] = useState<string[]>(restaurant?.cuisine ? [restaurant.cuisine] : []);
  const [tags, setTags] = useState<string[]>(restaurant?.tags ?? []);
  const formRef = useRef<HTMLFormElement>(null);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [location, setLocation] = useState<LatLng | null>(
    restaurant?.latitude != null && restaurant.longitude != null
      ? { lat: restaurant.latitude, lng: restaurant.longitude }
      : null,
  );

  /** A search result: pin it, fly there and fill the 2GIS fields it knows. */
  const onPick = (place: Place) => {
    const point = { lat: place.lat, lng: place.lng };
    setLocation(point);
    setFocus(point);

    const field = (name: string) => formRef.current?.elements.namedItem(name) as HTMLInputElement | null;
    const gisAddress = field("gisAddress");
    if (gisAddress && place.address) gisAddress.value = place.address;
    // don't overwrite a link the admin already set
    const gisLink = field("gisLink");
    if (gisLink && place.gisLink && !gisLink.value.trim()) gisLink.value = place.gisLink;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data: RestaurantInput = {
      name: text(form.get("name"))!,
      address: text(form.get("address"))!,
      gisAddress: text(form.get("gisAddress")),
      cuisine: cuisine[0] ?? null,
      workTime: text(form.get("workTime")),
      priceMin: int(form.get("priceMin")),
      priceMax: int(form.get("priceMax")),
      phone: text(form.get("phone")),
      email: text(form.get("email")),
      image: text(form.get("image")),
      gisLink: text(form.get("gisLink")),
      description: text(form.get("description")),
      tags,
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
    };

    save.mutate(
      { id: restaurant?.id, data },
      // a new restaurant has no tables yet, so stay here to add them
      { onSuccess: (saved) => router.push(restaurant ? "/admin" : `/edit?id=${saved.id}`) },
    );
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="surface grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-8">
      {fields.map((f) => (
        <label key={f.name}>
          <span className="caption mb-1.5 block">
            {f.label} {"required" in f && <span className="text-destructive">*</span>}
          </span>
          <Input
            name={f.name}
            type={"type" in f ? f.type : "text"}
            min={"type" in f && f.type === "number" ? 0 : undefined}
            step={"type" in f && f.type === "number" ? 1 : undefined}
            placeholder={f.placeholder}
            defaultValue={restaurant?.[f.name] ?? ""}
            required={"required" in f}
            className="h-10 rounded-xl"
          />
        </label>
      ))}

      <div className="space-y-2 sm:col-span-2">
        <span className="caption block">Cuisine</span>
        <ChipPicker options={CUISINES} value={cuisine} onChange={setCuisine} single customPlaceholder="Other cuisine" />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <span className="caption block">Tags {tags.length > 0 && <span className="normal-case">({tags.length})</span>}</span>
        <ChipPicker options={TAGS} value={tags} onChange={setTags} customPlaceholder="Other tag" />
      </div>

      <label className="sm:col-span-2">
        <span className="caption mb-1.5 block">Description</span>
        <Textarea
          name="description"
          placeholder="Describe the restaurant..."
          defaultValue={restaurant?.description ?? ""}
          className="min-h-24 rounded-xl"
        />
      </label>

      <div className="sm:col-span-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="caption">Location on map</span>
          {location ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={12} className="text-primary" />
              {location.lat}, {location.lng}
              <button
                type="button"
                onClick={() => setLocation(null)}
                className="flex items-center gap-0.5 text-destructive hover:underline"
              >
                <X size={12} /> Clear
              </button>
            </span>
          ) : (
            <span className="text-xs text-orange">Not set — the restaurant won&apos;t appear on the map</span>
          )}
        </div>
        <PlaceSearch onPick={onPick} />
        {/* `isolate` keeps Leaflet's panes below the sticky header */}
        <div className="isolate h-64 overflow-hidden rounded-xl ring-1 ring-border sm:h-80">
          <LocationPicker value={location} onChange={setLocation} focus={focus} />
        </div>
        <p className="text-xs text-muted-foreground">
          Search above, or click on the map to place the pin and drag it to adjust. Picking a result also fills the 2GIS
          address (and the 2GIS link for a place).
        </p>
      </div>

      {restaurant ? (
        <TablesEditor restaurantId={restaurant.id} />
      ) : (
        <p className="sm:col-span-2 text-xs text-muted-foreground">You&apos;ll add tables right after creating the restaurant.</p>
      )}

      {save.error && (
        <p className="sm:col-span-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage(save.error)}
        </p>
      )}

      <div className="sm:col-span-2 flex gap-3">
        <Button type="submit" disabled={save.isPending} className="h-10 rounded-xl px-5">
          {save.isPending && <Loader2 className="animate-spin" />}
          {restaurant ? "Save changes" : "Create restaurant"}
        </Button>
        <Link href="/admin" className={buttonVariants({ variant: "outline", className: "h-10 rounded-xl px-5" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
};

const RestaurantForm = ({ id }: { id?: string }) => {
  const { data: restaurant, isPending, error } = useRestaurant(id);

  if (id && isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> Loading restaurant...
      </div>
    );
  }

  if (id && (error || !restaurant)) {
    return <p className="surface p-8 text-center text-muted-foreground">Restaurant not found: {errorMessage(error)}</p>;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{restaurant ? `Edit ${restaurant.name}` : "New restaurant"}</h1>
      <Form key={restaurant?.updatedAt} restaurant={restaurant} />
    </>
  );
};

export default RestaurantForm;
