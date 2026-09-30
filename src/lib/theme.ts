import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// the <html> class set by THEME_SCRIPT is the source of truth
const read = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export const setTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  listeners.forEach((l) => l());
};

export const useTheme = () => useSyncExternalStore(subscribe, read, () => "light" as Theme);
