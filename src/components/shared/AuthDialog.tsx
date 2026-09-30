"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { signInWithGoogle } from "@/lib/api";
import { useLogin, useRegister } from "@/lib/auth";
import { errorMessage } from "@/lib/restaurants";
import { useStore } from "@/lib/store";

type Mode = "login" | "register";

const copy = {
  login: {
    title: "Welcome back",
    text: "Sign in to book tables and keep your favorites.",
    submit: "Sign in",
    switchText: "New to TableGo?",
    switchTo: "Create an account",
  },
  register: {
    title: "Create an account",
    text: "Your reservations and favorites are saved to it.",
    submit: "Sign up",
    switchText: "Already have an account?",
    switchTo: "Sign in",
  },
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
  </svg>
);

const field = "h-11 rounded-xl";

/** Email sign-in with a switch to sign-up, plus Google. Opened from anywhere via the store's openAuth(). */
const AuthDialog = () => {
  const open = useStore((s) => s.authOpen);
  const closeAuth = useStore((s) => s.closeAuth);
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const register = useRegister();
  const action = mode === "login" ? login : register;
  const t = copy[mode];

  const switchMode = () => {
    login.reset();
    register.reset();
    setMode(mode === "login" ? "register" : "login");
  };

  const onOpenChange = (next: boolean) => {
    if (next) return;
    closeAuth();
    login.reset();
    register.reset();
    setMode("login");
    setShowPassword(false);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name: String(form.get("name")).trim(), email, password });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl p-6 sm:max-w-md sm:p-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight">{t.title}</DialogTitle>
          <DialogDescription>{t.text}</DialogDescription>
        </DialogHeader>

        {/* keyed by mode so switching starts with empty fields */}
        <form key={mode} onSubmit={onSubmit} className="space-y-3">
          {mode === "register" && (
            <Input name="name" autoComplete="name" placeholder="Your name" required maxLength={100} className={field} />
          )}
          <Input name="email" type="email" autoComplete="email" placeholder="Email" required maxLength={254} className={field} />
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Password" : "Password (8+ characters)"}
              required
              minLength={mode === "register" ? 8 : undefined}
              maxLength={200}
              className={`${field} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {action.error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage(action.error)}
            </p>
          )}

          <Button type="submit" disabled={action.isPending} className="h-11 w-full rounded-xl text-base">
            {action.isPending && <Loader2 className="animate-spin" />}
            {t.submit}
          </Button>
        </form>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">{t.switchText}</p>
          <Button type="button" variant="outline" onClick={switchMode} className="h-11 w-full rounded-xl">
            {t.switchTo}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" onClick={signInWithGoogle} className="h-11 w-full gap-2 rounded-xl">
          <GoogleIcon /> Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
