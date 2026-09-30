import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  role?: string;
};

// Restaurants, bookings and favorites come from the API; the store keeps only the session.
type Store = {
  user: User;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  /** The sign-in / sign-up dialog; not persisted. */
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
};

const guestUser: User = { name: "User Name", email: "user@example.com", phone: "" };

export const useStore = create<Store>()(
  persist(
    (set) => ({
      user: guestUser,
      token: null,
      authOpen: false,

      setAuth: (token, user) => set({ token, user, authOpen: false }),

      logout: () => set({ token: null, user: guestUser }),

      updateUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),

      openAuth: () => set({ authOpen: true }),
      closeAuth: () => set({ authOpen: false }),
    }),
    {
      name: "tablego",
      partialize: ({ user, token }) => ({ user, token }),
      // rehydrated in layout.c.tsx to avoid SSR mismatch
      skipHydration: true,
      // v1: restaurants moved to the API. v3: bookings and favorites moved to the API,
      // so the ones kept in the browser are dropped.
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<Store> & Record<string, unknown>;
        delete state.restaurants;
        delete state.bookings;
        delete state.favorites;
        return state as Store;
      },
    },
  ),
);
