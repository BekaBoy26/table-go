"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import BackLink from "@/components/shared/BackLink";
import RestaurantImage from "@/components/shared/RestaurantImage";
import Status from "@/components/shared/Status";
import { api } from "@/lib/api";
import { MAX_GUESTS } from "@/lib/bookings";
import { Restaurant, errorMessage } from "@/lib/restaurants";
import { formatPrice } from "@/lib/utils";

type AiSearchInput = { query: string; guests?: number; budget?: number; atmosphere?: string };

type AiSearchResult = {
  message: string;
  matches: { restaurant: Restaurant; reason: string }[];
  /** false when Gemini was busy or off and the API fell back to keyword matching */
  ai: boolean;
};

const examples = ["Quiet place for a date, under 3000 KGS", "Суши с друзьями сегодня вечером", "Plov for a big family dinner"];

/** A whole number within the API's limits, or undefined for empty/invalid input. */
const toInt = (value: string | null, min: number, max = Infinity) => {
  const n = Math.round(Number(value));
  return value?.trim() && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};

/** The search lives in the URL, so going back from a restaurant shows the same results. */
const readInput = (params: URLSearchParams): AiSearchInput | null => {
  const query = params.get("q")?.trim();
  if (!query) return null;
  return {
    query,
    guests: toInt(params.get("guests"), 1, MAX_GUESTS),
    budget: toInt(params.get("budget"), 0),
    atmosphere: params.get("mood")?.trim() || undefined,
  };
};

const AiSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const input = readInput(params);

  const [text, setText] = useState(input?.query ?? "");
  const [guests, setGuests] = useState(input?.guests?.toString() ?? "");
  const [budget, setBudget] = useState(input?.budget?.toString() ?? "");
  const [atmosphere, setAtmosphere] = useState(input?.atmosphere ?? "");

  const search = useQuery({
    queryKey: ["ai-search", input],
    queryFn: async () => (await api.post<AiSearchResult>("/ai/search", input)).data,
    enabled: !!input,
    // each call costs money: reuse the answer while the tab is open, and don't retry 429s
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
  });

  const onSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = text.trim();
    if (!query || search.isFetching) return;

    const next = new URLSearchParams({ q: query });
    const g = toInt(guests, 1, MAX_GUESTS);
    const b = toInt(budget, 0);
    if (g) next.set("guests", String(g));
    if (b !== undefined) next.set("budget", String(b));
    if (atmosphere.trim()) next.set("mood", atmosphere.trim());
    // show the values that will actually be sent
    setGuests(g?.toString() ?? "");
    setBudget(b?.toString() ?? "");

    // the same search again asks again (e.g. after "AI is busy")
    if (next.toString() === params.toString()) search.refetch();
    else router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const result = search.data;
  const loading = search.isFetching;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/" />

      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles size={14} /> AI Restaurant Finder
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Tell us what you&apos;re looking for</h1>
      <p className="mt-2 text-muted-foreground">
        Describe it in your own words — in English or Russian — and we&apos;ll find the best match in Bishkek.
      </p>

      <form onSubmit={onSearch}>
        <div className="surface mt-8 space-y-4 p-5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter searches, Shift+Enter adds a line
              if (e.key === "Enter" && !e.shiftKey) onSearch(e);
            }}
            maxLength={500}
            aria-label="What are you looking for?"
            placeholder="I want a quiet restaurant for a date, under 3000 KGS..."
            className="min-h-28 resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {!text && (
            <div className="flex flex-wrap gap-2">
              {examples.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setText(e)}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
            <Input
              type="number"
              min={1}
              max={MAX_GUESTS}
              step={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Guests (e.g. 2)"
              aria-label="Guests"
              className="h-10 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              step={100}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget per person, KGS"
              aria-label="Budget per person, KGS"
              className="h-10 rounded-xl"
            />
            <Input
              value={atmosphere}
              onChange={(e) => setAtmosphere(e.target.value)}
              maxLength={100}
              placeholder="Atmosphere (e.g. Quiet)"
              aria-label="Atmosphere"
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <Button type="submit" disabled={!text.trim() || loading} className="mt-4 h-12 w-full rounded-xl text-base">
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Finding the best places...
            </>
          ) : (
            <>
              Find restaurants <Sparkles />
            </>
          )}
        </Button>
      </form>

      {search.error && !loading && (
        <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage(search.error)}</p>
      )}

      {loading && (
        <div className="mt-10 space-y-3" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      )}

      {result && !loading && (
        <div className="mt-10 space-y-3">
          {result.message && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              {result.ai && <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />}
              {result.message}
            </p>
          )}
          {!result.matches.length && (
            <div className="surface flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <SearchX className="text-muted-foreground" />
              No restaurant fits this request — try other words, a bigger budget or fewer guests.
            </div>
          )}
          {result.matches.map(({ restaurant: r, reason }) => (
            <Link
              key={r.id}
              href={input?.guests ? `/restaurant/${r.id}/book?guests=${input.guests}` : `/restaurant/${r.id}`}
              className="surface flex items-start gap-4 p-4 transition-shadow hover:shadow-md"
            >
              <RestaurantImage src={r.image} alt={r.name} width={64} height={64} className="size-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="font-semibold">{r.name}</p>
                  <Status type={r.availableToday ? "available" : "booked"} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {[r.cuisine, formatPrice(r.priceMin, r.priceMax)].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm">{reason}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// useSearchParams needs a Suspense boundary on statically rendered pages
const Page = () => (
  <Suspense>
    <AiSearch />
  </Suspense>
);

export default Page;
