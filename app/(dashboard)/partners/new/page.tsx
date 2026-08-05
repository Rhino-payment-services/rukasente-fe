"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Building2,
  Copy,
  Globe2,
  Handshake,
  Mail,
  Palette,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreatePartner,
  usePaymentProviders,
  useRegisterLendingCompany,
} from "@/hooks/use-partners";
import { cn } from "@/lib/utils";
import type { RegisterLendingCompanyResult } from "@/types/partner";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[rgba(8,22,61,0.15)]";

function Field({
  label,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
        {label}
        {optional ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Optional
          </span>
        ) : (
          <span className="text-rose-500">*</span>
        )}
      </span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(8,22,61,0.06)] text-[#08163d]">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function slugifyCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
}

export default function NewPartnerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isPlatform = !!session?.user?.isPlatform;
  const create = useCreatePartner();
  const register = useRegisterLendingCompany();
  const providersQ = usePaymentProviders();
  const [codeTouched, setCodeTouched] = useState(false);
  const [tempReveal, setTempReveal] = useState<RegisterLendingCompanyResult | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
    country: "UG",
    currency: "UGX",
    primary_color: "#4f46e5",
    payment_provider_id: "",
    api_base_url: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    allowed_ips_text: "127.0.0.1\n::1",
    ip_whitelist_enabled: true,
    admin_email: "",
    admin_name: "",
    admin_password: "",
  });

  const providers = providersQ.data?.items ?? [];
  const pending = create.isPending || register.isPending;

  const previewInitials = useMemo(() => {
    const parts = form.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "P";
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`.toUpperCase();
  }, [form.name]);

  function setName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      code: codeTouched ? f.code : slugifyCode(name),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    if (isPlatform) {
      if (!form.admin_email.trim() || !form.admin_name.trim()) {
        toast.error("Admin email and full name are required");
        return;
      }
      try {
        const result = await register.mutateAsync({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          primary_color: form.primary_color.trim() || undefined,
          country: form.country.trim() || undefined,
          currency: form.currency.trim() || undefined,
          payment_provider_id: form.payment_provider_id || null,
          contact_name: form.contact_name.trim() || undefined,
          contact_email: form.contact_email.trim() || undefined,
          contact_phone: form.contact_phone.trim() || undefined,
          logo_url: form.logo_url.trim() || undefined,
          admin_email: form.admin_email.trim(),
          admin_name: form.admin_name.trim(),
          admin_password: form.admin_password.trim() || undefined,
        });
        setTempReveal(result);
        toast.success("Lending company registered");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to register company"
        );
      }
      return;
    }

    try {
      const allowed_ips = form.allowed_ips_text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const p = await create.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status,
        api_base_url: form.api_base_url.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        logo_url: form.logo_url.trim(),
        country: form.country.trim() || undefined,
        currency: form.currency.trim() || undefined,
        primary_color: form.primary_color.trim() || undefined,
        payment_provider_id: form.payment_provider_id || null,
        allowed_ips,
        ip_whitelist_enabled: form.ip_whitelist_enabled,
      });
      toast.success("Partner created — generate API credentials next");
      router.push(`/partners/${p.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create partner");
    }
  }

  const title = isPlatform ? "Register lending company" : "New partner";
  const subtitle = isPlatform
    ? "Create a tenant partner and bootstrap admin account."
    : "Register an integration tenant that can call Ruka Sente APIs.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[rgba(8,22,61,0.07)] text-[#08163d]">
            <Handshake className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
          <Link href="/partners">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
            <CardContent className="space-y-8 p-5 sm:p-6">
              <Section
                icon={Building2}
                title="Identity"
                description={
                  isPlatform
                    ? "How this lending company appears on the platform."
                    : "How this partner appears across Ruka Sente."
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isPlatform ? "Company name" : "Partner name"}
                    className="sm:col-span-2"
                  >
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Agati Finance"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Code" hint="Unique uppercase ID">
                    <Input
                      required
                      value={form.code}
                      onChange={(e) => {
                        setCodeTouched(true);
                        setForm((f) => ({
                          ...f,
                          code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                        }));
                      }}
                      placeholder="AGATI"
                      className={cn(inputClass, "font-mono tracking-wide")}
                    />
                  </Field>
                  <Field label="Country" optional>
                    <Input
                      value={form.country}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, country: e.target.value }))
                      }
                      placeholder="UG"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Currency" optional>
                    <Input
                      value={form.currency}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          currency: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="UGX"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Primary color" optional>
                    <div className="relative">
                      <Palette className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={form.primary_color}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            primary_color: e.target.value,
                          }))
                        }
                        placeholder="#4f46e5"
                        className={cn(inputClass, "pl-9")}
                      />
                    </div>
                  </Field>
                  <Field
                    label="Description"
                    optional
                    className="sm:col-span-2"
                  >
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={3}
                      placeholder="Lending company for western region…"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[rgba(8,22,61,0.15)]"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                icon={Wallet}
                title="Payment rail"
                description="Disbursement provider for this company."
              >
                <Field label="Payment provider" optional>
                  <select
                    value={form.payment_provider_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        payment_provider_id: e.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Default / none</option>
                    {providers.map((pp) => (
                      <option key={pp.id} value={pp.id}>
                        {pp.name} ({pp.code})
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>

              <Section
                icon={UserRound}
                title="Contact"
                description="Ops contact for this company."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact name" optional className="sm:col-span-2">
                    <Input
                      value={form.contact_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, contact_name: e.target.value }))
                      }
                      placeholder="Jane Okello"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email" optional>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        value={form.contact_email}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            contact_email: e.target.value,
                          }))
                        }
                        placeholder="ops@company.com"
                        className={cn(inputClass, "pl-9")}
                      />
                    </div>
                  </Field>
                  <Field label="Phone" optional>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={form.contact_phone}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            contact_phone: e.target.value,
                          }))
                        }
                        placeholder="+2567…"
                        className={cn(inputClass, "pl-9")}
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              {isPlatform ? (
                <Section
                  icon={Globe2}
                  title="Bootstrap admin"
                  description="First staff user for this lending company. Password is shown once if generated."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Admin full name" className="sm:col-span-2">
                      <Input
                        required
                        value={form.admin_name}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            admin_name: e.target.value,
                          }))
                        }
                        placeholder="Admin name"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Admin email">
                      <Input
                        required
                        type="email"
                        value={form.admin_email}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            admin_email: e.target.value,
                          }))
                        }
                        placeholder="admin@company.com"
                        className={inputClass}
                      />
                    </Field>
                    <Field
                      label="Admin password"
                      optional
                      hint="Leave blank to auto-generate a temporary password"
                    >
                      <Input
                        type="password"
                        value={form.admin_password}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            admin_password: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        className={inputClass}
                        autoComplete="new-password"
                      />
                    </Field>
                  </div>
                </Section>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl"
                >
                  <Link href="/partners">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-9 rounded-xl bg-[#08163d] px-4 text-white hover:bg-[#06102a]"
                >
                  {pending
                    ? "Saving…"
                    : isPlatform
                      ? "Register company"
                      : "Create partner"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card className="gap-0 overflow-hidden border-slate-200/80 py-0 shadow-sm">
              <div
                className="px-5 py-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${form.primary_color || "#08163d"}, #142a5c)`,
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                  Live preview
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold ring-1 ring-white/20">
                    {previewInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold tracking-tight">
                      {form.name.trim() || "Company name"}
                    </p>
                    <p className="font-mono text-xs text-white/70">
                      {form.code.trim() || "CODE"} · {form.currency || "UGX"}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-2 p-5 text-xs text-slate-600">
                {isPlatform ? (
                  <ol className="list-decimal space-y-1.5 pl-4">
                    <li>Register creates the partner tenant and admin staff user.</li>
                    <li>Copy the temporary password — it is shown only once.</li>
                    <li>Admin signs in and can manage loans for that company.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal space-y-1.5 pl-4">
                    <li>Open the partner and generate API credentials.</li>
                    <li>Share the API key + secret once.</li>
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <Dialog
        open={!!tempReveal}
        onOpenChange={(open) => {
          if (!open && tempReveal) {
            const id = tempReveal.partner.id;
            setTempReveal(null);
            router.push(`/partners/${id}`);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary admin password</DialogTitle>
            <DialogDescription>
              {tempReveal?.warning ||
                "Copy this password now. It will not be shown again."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 py-4">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Admin email</p>
              <p className="text-sm text-slate-900">{tempReveal?.admin_email}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-amber-800/80">
                  Temporary password
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    if (!tempReveal?.admin_password) return;
                    void navigator.clipboard.writeText(tempReveal.admin_password);
                    toast.success("Password copied");
                  }}
                >
                  <Copy className="size-3" />
                  Copy
                </Button>
              </div>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">
                {tempReveal?.admin_password}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#08163d] text-white hover:bg-[#06102a]"
              onClick={() => {
                const id = tempReveal?.partner.id;
                setTempReveal(null);
                if (id) router.push(`/partners/${id}`);
              }}
            >
              I’ve saved it — open company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
