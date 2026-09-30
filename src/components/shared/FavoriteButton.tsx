"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useFavorites, useToggleFavorite } from "@/lib/favorites";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  className?: string;
};

const FavoriteButton = ({ id, className }: Props) => {
  const token = useStore((s) => s.token);
  const openAuth = useStore((s) => s.openAuth);
  const active = useFavorites().includes(id);
  const toggle = useToggleFavorite();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // favorites are saved to the account
    if (!token) return openAuth();
    toggle.mutate({ id, active });
  };

  return (
    <button
      onClick={onClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={token ? undefined : "Sign in to save favorites"}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-card/90 backdrop-blur transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <Heart size={16} className={cn("transition-colors", active ? "fill-orange text-orange" : "text-muted-foreground")} />
    </button>
  );
};

export default FavoriteButton;
