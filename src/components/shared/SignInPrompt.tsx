"use client";

import React from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

type Props = {
  title: string;
  text?: string;
};

/** Shown instead of pages that need an account; the page updates in place after sign-in. */
const SignInPrompt = ({ title, text }: Props) => {
  const openAuth = useStore((s) => s.openAuth);

  return (
    <div className="surface mx-auto max-w-sm space-y-4 p-8 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <Button onClick={openAuth} className="h-10 rounded-xl px-5">
        <LogIn /> Sign in
      </Button>
    </div>
  );
};

export default SignInPrompt;
