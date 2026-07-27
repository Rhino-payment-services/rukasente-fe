"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe2,
  Handshake,
  ImageIcon,
  Link2,
  Mail,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreatePartner } from "@/hooks/use-partners";
import { cn } from "@/lib/utils";

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
  const create = useCreatePartner();
  const [codeTouched, setCodeTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
    api_base_url: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    allowed_ips_text: "127.0.0.1\n::1",
    ip_whitelist_enabled: true,
  });

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
      toast.error("Partner name and code are required");
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
        allowed_ips,
        ip_whitelist_enabled: form.ip_whitelist_enabled,
      });
      toast.success("Partner created — generate API credentials next");
      router.push(`/partners/${p.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create partner");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[rgba(8,22,61,0.07)] text-[#08163d]">
            <Handshake className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              New partner
            </h1>
            <p className="text-xs text-slate-500">
              Register an integration tenant that can call Ruka Sente APIs.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
          <Link href="/partners">
            <ArrowLeft className="size-3.5" />
            Back to partners
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
                description="How this partner appears across Ruka Sente."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Partner name"
                    hint="Display name shown to staff"
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
                  <Field
                    label="Partner code"
                    hint="Unique uppercase ID used in APIs and audits"
                  >
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
                  <Field label="Status" hint="Inactive partners cannot call APIs">
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {(["active", "inactive"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: s }))}
                          className={cn(
                            "h-8 rounded-lg text-xs font-medium capitalize transition-colors",
                            form.status === s
                              ? "bg-white text-[#08163d] shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field
                    label="Description"
                    optional
                    hint="Internal note about this integration"
                    className="sm:col-span-2"
                  >
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={3}
                      placeholder="Mobile money lending partner for western region…"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[rgba(8,22,61,0.15)]"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                icon={Globe2}
                title="Integration"
                description="Technical endpoints and documentation for this partner."
              >
                <Field
                  label="API base URL"
                  optional
                  hint="Partner callback base or docs URL (informational)"
                >
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={form.api_base_url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, api_base_url: e.target.value }))
                      }
                      placeholder="https://api.partner.example.com"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </Field>
              </Section>

              <Section
                icon={Shield}
                title="IP whitelist"
                description="Partner API calls must use a key and come from an allowed IP."
              >
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.ip_whitelist_enabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ip_whitelist_enabled: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300"
                  />
                  Require IP whitelist
                </label>
                <Field
                  label="Allowed IPs / CIDRs"
                  optional
                  hint="One per line. Only enforced when Require IP whitelist is on. Include the caller’s public egress IP."
                >
                  <textarea
                    value={form.allowed_ips_text}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        allowed_ips_text: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder={"127.0.0.1\n10.0.0.0/8"}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[rgba(8,22,61,0.15)]"
                  />
                </Field>
              </Section>

              <Section
                icon={UserRound}
                title="Contact"
                description="Who we reach for ops and credential issues."
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
                          setForm((f) => ({ ...f, contact_email: e.target.value }))
                        }
                        placeholder="integrations@partner.com"
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
                          setForm((f) => ({ ...f, contact_phone: e.target.value }))
                        }
                        placeholder="+2567…"
                        className={cn(inputClass, "pl-9")}
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section
                icon={ImageIcon}
                title="Branding"
                description="Optional logo used in partner detail views."
              >
                <Field label="Logo URL" optional hint="HTTPS image URL">
                  <Input
                    value={form.logo_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logo_url: e.target.value }))
                    }
                    placeholder="https://cdn.partner.com/logo.png"
                    className={inputClass}
                  />
                </Field>
              </Section>

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
                  disabled={create.isPending}
                  className="h-9 rounded-xl bg-[#08163d] px-4 text-white hover:bg-[#06102a]"
                >
                  {create.isPending ? "Creating…" : "Create partner"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card className="gap-0 overflow-hidden border-slate-200/80 py-0 shadow-sm">
              <div className="bg-gradient-to-br from-[#08163d] to-[#142a5c] px-5 py-5 text-white">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                  Live preview
                </p>
                <div className="mt-4 flex items-center gap-3">
                  {form.logo_url.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logo_url.trim()}
                      alt=""
                      className="size-12 rounded-xl bg-white/10 object-contain p-1 ring-1 ring-white/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold ring-1 ring-white/20">
                      {previewInitials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold tracking-tight">
                      {form.name.trim() || "Partner name"}
                    </p>
                    <p className="font-mono text-xs text-white/70">
                      {form.code.trim() || "CODE"}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-3 p-5 text-sm">
                <Row
                  label="Status"
                  value={
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                        form.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {form.status}
                    </span>
                  }
                />
                <Row
                  label="Description"
                  value={form.description.trim() || "—"}
                />
                <Row label="API URL" value={form.api_base_url.trim() || "—"} mono />
                <Row
                  label="Contact"
                  value={
                    form.contact_name.trim() ||
                    form.contact_email.trim() ||
                    form.contact_phone.trim()
                      ? [
                          form.contact_name.trim(),
                          form.contact_email.trim(),
                          form.contact_phone.trim(),
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "—"
                  }
                />
              </CardContent>
            </Card>

            <Card className="gap-0 border-slate-200/80 bg-slate-50/60 py-0 shadow-sm">
              <CardContent className="space-y-2 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">After create</p>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>Open the partner and generate API credentials.</li>
                  <li>Share the API key + secret once (secret is not shown again).</li>
                  <li>
                    Partner authenticates with{" "}
                    <code className="rounded bg-white px-1">X-API-Key</code> and{" "}
                    <code className="rounded bg-white px-1">X-API-Secret</code>.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right text-slate-800",
          mono && "break-all font-mono text-[11px]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
