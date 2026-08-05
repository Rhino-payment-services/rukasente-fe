"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RUKAPAY_LOGO_SRC } from "@/components/brand/rukapay-logo-mark";
import { FullPageLoading } from "@/components/ui/loading";
import { toast } from "sonner";

const DASHBOARD_PATH = "/";

function goToDashboard() {
  // Hard navigation — App Router soft replace often stalls after next-auth signIn.
  window.location.assign(DASHBOARD_PATH);
}

export default function LoginPage() {
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    document.title = "Sign In · Ruka Sente";
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    setRedirecting(true);
    // Brief pause so the branded loader is visible, then hard-navigate home.
    const timer = window.setTimeout(() => {
      goToDashboard();
    }, 1200);

    // Safety net: if something blocks navigation, force it again.
    const fallback = window.setTimeout(() => {
      goToDashboard();
    }, 2800);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await signIn("rukasente-staff", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.ok) {
        const { clearCachedAccessToken } = await import("@/lib/api-client");
        clearCachedAccessToken();
        toast.success("Welcome back");
        setRedirecting(true);
        // Session will flip to authenticated; the effect above handles navigation.
        // Kick an immediate hard redirect as well so we never sit forever.
        window.setTimeout(() => goToDashboard(), 1200);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <FullPageLoading message="Checking your session..." />;
  }

  if (status === "authenticated" || redirecting) {
    return <FullPageLoading message="Signing you in..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9">
        <div className="mb-10 flex items-center justify-between gap-3">
          <Image
            src={RUKAPAY_LOGO_SRC}
            alt="RukaSente"
            width={360}
            height={180}
            className="h-20 w-auto object-contain sm:h-24"
            priority
          />
          <p className="hidden text-sm text-slate-500 sm:block">Welcome back</p>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Get Started Now
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please enter your information to access your account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-600">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-main-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 pr-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-main-200"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-medium text-main-600 hover:text-main-700"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 h-11 w-full rounded-xl bg-main-600 text-sm font-medium text-white hover:bg-main-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
