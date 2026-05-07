"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff, Globe, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RUKAPAY_LOGO_SRC } from "@/components/brand/rukapay-logo-mark";
import { FullPageLoading } from "@/components/ui/loading";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign In · Ruka Sente";
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

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
        // Drop any stale token from the previous session so the next API call
        // pulls the fresh JWT from /api/auth/session instead of the old one.
        const { clearCachedAccessToken } = await import("@/lib/api-client");
        clearCachedAccessToken();
        toast.success("Welcome back");
        router.replace("/");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return <FullPageLoading message="Loading..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9">
        <div className="mb-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-main-50 ring-1 ring-main-100">
              <Image
                src={RUKAPAY_LOGO_SRC}
                alt="RukaPay"
                width={28}
                height={28}
                className="rounded-sm object-cover"
                priority
              />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Ruka Sente
            </span>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">Welcome back</p>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Get Started Now
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please enter your information to access your account.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Globe className="size-4 text-main-600" aria-hidden />
            Log In with Google
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Apple className="size-4" aria-hidden />
            Log In with Apple
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
