"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RUKAPAY_LOGO_SRC } from "@/components/brand/rukapay-logo-mark";
import { FullPageLoading } from "@/components/ui/loading";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-gradient-to-br from-main-50 via-white to-main-50 flex items-center justify-center p-4 sm:p-6">
      {/* Narrow column — compact, single visual rhythm */}
      <div className="w-full max-w-[22rem] sm:max-w-[24rem]">
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="size-[2.75rem] shrink-0 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-black/[0.06]">
              <Image
                src={RUKAPAY_LOGO_SRC}
                alt="RukaPay"
                width={40}
                height={40}
                className="rounded-md size-10 object-cover"
                priority
              />
            </div>
            <span className="text-[1.375rem] sm:text-2xl font-bold text-[#08163d] tracking-tight leading-none">
              Ruka Sente
            </span>
          </div>
          <h1 className="text-lg font-semibold text-[#08163d] mb-1">Sign in</h1>
          <p className="text-xs text-gray-500 leading-snug">
            Staff operations console
          </p>
        </header>

        <Card className="p-5 sm:p-6 shadow-md border border-gray-200/80 bg-white/90 backdrop-blur-sm rounded-xl gap-0">
          <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
            Credentials from your administrator.
          </p>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-gray-600"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-9 text-sm rounded-md border-gray-200 bg-white shadow-none focus-visible:ring-1 focus-visible:ring-[#08163d]/30 focus-visible:border-[#08163d]/35"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-gray-600"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-9 h-9 text-sm rounded-md border-gray-200 bg-white shadow-none focus-visible:ring-1 focus-visible:ring-[#08163d]/30 focus-visible:border-[#08163d]/35"
                />
              </div>
              <p className="text-[11px] text-gray-400 pt-0.5">
                At least 8 characters.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 text-sm font-semibold rounded-md bg-main-600 hover:bg-main-700 text-white shadow-sm gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-[11px] text-center text-gray-400 mt-4 leading-tight">
            Need an account? Contact your IT team.
          </p>
        </Card>
      </div>
    </div>
  );
}
