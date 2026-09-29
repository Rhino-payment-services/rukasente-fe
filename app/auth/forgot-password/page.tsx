"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RUKAPAY_LOGO_SRC } from "@/components/brand/rukapay-logo-mark";
import { apiClient } from "@/lib/api-client";
import { getAxiosApiErrorMessage, unwrapEnvelope } from "@/lib/api-envelope";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Reset password · Ruka Sente";
  }, []);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post("/admin/auth/forgot-password", { email });
      unwrapEnvelope<{ message: string }>(res);
      toast.success("If your account has a phone number, we sent a code.");
      setStep("code");
    } catch (err) {
      toast.error(getAxiosApiErrorMessage(err, "Could not send a reset code"));
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/admin/auth/reset-password", {
        email,
        code,
        password,
      });
      unwrapEnvelope<{ reset: boolean }>(res);
      toast.success("Password updated. Sign in with the new password.");
      setStep("done");
    } catch (err) {
      toast.error(getAxiosApiErrorMessage(err, "Could not reset password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Image
            src={RUKAPAY_LOGO_SRC}
            alt="RukaSente"
            width={360}
            height={180}
            className="h-20 w-auto object-contain sm:h-24"
            priority
          />
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Sign in
          </Link>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === "email"
            ? "Enter the email on your staff account. We’ll text a code to the phone number we have on file."
            : step === "code"
              ? "Enter the 6-digit code from the text message and choose a new password."
              : "Your password is updated. Sign in with the new one."}
        </p>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
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
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-main-600 text-sm font-medium text-white hover:bg-main-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Sending code...
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-xs font-medium text-slate-600">
                Reset code
              </label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                minLength={6}
                maxLength={6}
                pattern="\d{6}"
                className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none tracking-widest focus-visible:ring-2 focus-visible:ring-main-200"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-slate-600">
                New password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-main-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-xs font-medium text-slate-600">
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:ring-2 focus-visible:ring-main-200"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-main-600 text-sm font-medium text-white hover:bg-main-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs font-medium text-main-600 hover:text-main-700"
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <Button
            asChild
            className="mt-6 h-11 w-full rounded-xl bg-main-600 text-sm font-medium text-white hover:bg-main-700"
          >
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        ) : null}
      </section>
    </div>
  );
}
