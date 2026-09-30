"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogIn, Menu, Search, Sparkles, UtensilsCrossed, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { isUpcoming, useMyBookings } from "@/lib/bookings";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import s from "./header.module.scss";

const links = [
  { href: "/", label: "Restaurants" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

/** Mirrors ?q= so the field shows the active search and empties when it's cleared. */
const SearchForm = ({ onSearch }: { onSearch?: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = pathname === "/" ? (params.get("q") ?? "") : "";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
    onSearch?.();
  };

  return (
    <form onSubmit={onSubmit} className={s.search} role="search">
      <Search size={16} />
      <input key={q} name="q" type="search" defaultValue={q} placeholder="Search restaurants..." aria-label="Search restaurants" />
    </form>
  );
};

const Header = () => {
  const pathname = usePathname();
  const name = useStore((state) => state.user.name);
  const avatar = useStore((state) => state.user.avatar);
  const token = useStore((state) => state.token);
  const openAuth = useStore((state) => state.openAuth);
  const isAdmin = useStore((state) => !!state.token && state.user.role === "ADMIN");
  const upcoming = (useMyBookings().data ?? []).filter(isUpcoming).length;
  // the menu (nav + search) is a dropdown below 1024px
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const nav = links
    .filter((l) => !l.adminOnly || isAdmin)
    .map((l) => (
      <Link key={l.href} href={l.href} onClick={close} className={cn(pathname === l.href && s.active)}>
        {l.label}
        {l.href === "/bookings" && upcoming > 0 && <span className={s.count}>{upcoming}</span>}
      </Link>
    ));

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link href="/" className={s.logo} onClick={close}>
          <UtensilsCrossed size={20} />
          TableGo
        </Link>

        <nav className={s.nav}>{nav}</nav>

        {/* useSearchParams needs a Suspense boundary on statically rendered pages */}
        <div className={s.desktopSearch}>
          <Suspense fallback={<div className={s.search} />}>
            <SearchForm />
          </Suspense>
        </div>

        <Link href="/ai-search" onClick={close} className={cn(buttonVariants({ size: "lg", className: "rounded-xl px-4" }), s.ai)} aria-label="AI Find">
          <Sparkles /> <span>AI Find</span>
        </Link>

        {/* logging out lives on the profile page */}
        {token ? (
          <Link href="/profile" onClick={close} className={s.avatar} aria-label="Profile" title="Profile">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- Google avatars break next/image referrer checks
              <img src={avatar} alt={name} referrerPolicy="no-referrer" />
            ) : (
              name[0]?.toUpperCase()
            )}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              close();
              openAuth();
            }}
            className={cn(buttonVariants({ variant: "outline", size: "lg", className: "rounded-xl px-4" }), s.signIn)}
            aria-label="Sign in"
          >
            <LogIn /> <span>Sign in</span>
          </button>
        )}

        <button
          type="button"
          className={s.menuButton}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className={s.mobileMenu}>
          <Suspense fallback={<div className={s.search} />}>
            <SearchForm onSearch={close} />
          </Suspense>
          <nav>{nav}</nav>
        </div>
      )}
    </header>
  );
};

export default Header;
