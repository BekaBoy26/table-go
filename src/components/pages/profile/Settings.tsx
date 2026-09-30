"use client";

import React from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Theme, setTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const Row = ({ title, text, children }: { title: string; text: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
    {children}
  </div>
);

/** Theme choice (saved in this browser) and signing out. */
const Settings = () => {
  const theme = useTheme();
  const email = useStore((s) => s.user.email);
  const logout = useStore((s) => s.logout);

  return (
    <div className="surface divide-y p-5 sm:p-6">
      <Row title="Theme" text="How TableGo looks on this device">
        <div className="flex rounded-xl bg-muted p-1" role="radiogroup" aria-label="Theme">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                theme === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </Row>

      <Row title="Account" text={`Signed in as ${email}`}>
        <Button variant="destructive" onClick={logout} className="h-10 rounded-xl px-4">
          <LogOut /> Log out
        </Button>
      </Row>
    </div>
  );
};

export default Settings;
