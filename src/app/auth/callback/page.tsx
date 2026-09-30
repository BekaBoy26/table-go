"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { API_URL, signInWithGoogle, takeReturnTo } from "@/lib/api";
import { useStore } from "@/lib/store";

type MeResponse = {
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
};

const Callback = () => {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [failed, setFailed] = useState(!token || params.has("error"));

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        // The layout rehydrates the store in its own effect, which runs after this one
        // and would overwrite the token — so rehydrate first.
        await useStore.persist.rehydrate();

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const me: MeResponse = await res.json();

        useStore.getState().setAuth(token, { ...me, phone: me.phone ?? "" });
        router.replace(takeReturnTo());
      } catch {
        setFailed(true);
      }
    })();
  }, [token, router]);

  if (failed) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-bold">Sign-in failed</h1>
        <p className="text-sm text-muted-foreground">Could not sign in with Google. Please try again.</p>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={signInWithGoogle} className={buttonVariants()}>
            Try again
          </button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Home
          </Link>
        </div>
      </div>
    );
  }

  return <Loading />;
};

const Loading = () => (
  <div className="flex items-center justify-center gap-2 text-muted-foreground">
    <Loader2 className="animate-spin" size={18} /> Signing you in...
  </div>
);

const AuthCallbackPage = () => (
  <Suspense fallback={<Loading />}>
    <Callback />
  </Suspense>
);

export default AuthCallbackPage;
