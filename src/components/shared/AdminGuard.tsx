"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { User, useStore } from "@/lib/store";

const waitForHydration = () =>
  new Promise<void>((resolve) => {
    if (useStore.persist.hasHydrated()) return resolve();
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });

/**
 * Lets only admins see the page. The role is re-checked on the server via /auth/me —
 * the one in localStorage can be edited by hand. Real protection lives in the API
 * (write endpoints require ADMIN); this just keeps non-admins off the UI.
 */
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForHydration();
      const { token, user } = useStore.getState();
      if (!token) return router.replace("/");

      try {
        const { data: me } = await api.get<User>("/auth/me");
        if (cancelled) return;
        useStore.getState().updateUser({ ...user, role: me.role, avatar: me.avatar });
        if (me.role === "ADMIN") setAllowed(true);
        else router.replace("/");
      } catch {
        if (!cancelled) router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // logging out while on an admin page
  const token = useStore((s) => s.token);
  useEffect(() => {
    if (allowed && !token) router.replace("/");
  }, [allowed, token, router]);

  if (!allowed || !token) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> Checking access...
      </div>
    );
  }

  return children;
};

export default AdminGuard;
