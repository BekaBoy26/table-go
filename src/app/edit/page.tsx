import React from "react";
import BackLink from "@/components/shared/BackLink";
import RestaurantForm from "@/components/pages/edit/RestaurantForm";

const page = async ({ searchParams }: PageProps<"/edit">) => {
  const { id } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/admin" label="Back to dashboard" />
      <RestaurantForm id={typeof id === "string" && id ? id : undefined} />
    </div>
  );
};

export default page;
