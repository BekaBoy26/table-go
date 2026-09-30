import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Restaurants from "@/components/pages/home/Restaurants";

const page = async ({ searchParams }: PageProps<"/">) => {
  const { q } = await searchParams;

  return (
    <>
      <section className="flex flex-col items-center py-6 text-center sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Find your perfect <span className="text-primary">restaurant</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Discover restaurants and book a table in just a few clicks.
        </p>
        <Link href="/ai-search" className={buttonVariants({ className: "mt-6 h-11 rounded-xl px-6 sm:mt-8" })}>
          <Sparkles /> AI Find a Restaurant
        </Link>
      </section>

      <Restaurants query={typeof q === "string" ? q : ""} />
    </>
  );
};

export default page;
