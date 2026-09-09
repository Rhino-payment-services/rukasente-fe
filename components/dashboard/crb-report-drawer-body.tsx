"use client";

import { useMemo, useState } from "react";
import { formatDetailValue } from "@/components/dashboard/detail-fields";
import { cn } from "@/lib/utils";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PHOTO_KEYS = new Set([
  "photo",
  "photograph",
  "profile_photo",
  "profile_image",
  "passport_photo",
  "image",
  "photo_base64",
]);

const HIGHLIGHT_KEYS = [
  "credit_score",
  "score",
  "metro_score",
  "metropol_score",
  "probability_of_default",
  "pd",
  "pd_percent",
  "full_name",
  "names",
  "name",
  "identity_number",
  "nin",
  "national_id",
  "gender",
  "date_of_birth",
  "phone",
  "mobile",
  "nationality",
  "watch",
  "npa",
  "malpractice",
  "has_malpractice",
  "accounts_in_arrears",
  "total_accounts",
  "reference",
  "trx_id",
];

function isLikelyBase64Image(value: string): boolean {
  const v = value.trim();
  if (v.length < 64) return false;
  if (v.startsWith("data:image/")) return true;
  if (v.startsWith("/9j/")) return true;
  if (v.startsWith("UklG")) return true;
  if (v.startsWith("iVBOR")) return true;
  if (v.startsWith("R0lGOD")) return true;
  return false;
}

function detectImageMime(base64: string): string {
  const v = base64.trim();
  if (v.startsWith("data:image/")) {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(v);
    return m?.[1] ?? "image/jpeg";
  }
  if (v.startsWith("/9j/")) return "image/jpeg";
  if (v.startsWith("UklG")) return "image/webp";
  if (v.startsWith("iVBOR")) return "image/png";
  if (v.startsWith("R0lGOD")) return "image/gif";
  return "image/jpeg";
}

function toDataUrl(raw: string): string {
  const v = raw.trim();
  if (v.startsWith("data:image/")) return v;
  return `data:${detectImageMime(v)};base64,${v}`;
}

type FoundPhoto = { label: string; path: string; dataUrl: string };

function collectPhotos(value: unknown, path: string[] = [], out: FoundPhoto[] = []): FoundPhoto[] {
  if (typeof value === "string") {
    const key = path[path.length - 1] ?? "photo";
    if (
      (PHOTO_KEYS.has(key.toLowerCase()) || isLikelyBase64Image(value)) &&
      isLikelyBase64Image(value)
    ) {
      out.push({
        label: path.length ? path.map(humanizeKey).join(" · ") : "Photo",
        path: path.join("."),
        dataUrl: toDataUrl(value),
      });
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectPhotos(item, [...path, String(i + 1)], out));
    return out;
  }
  if (isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      collectPhotos(v, [...path, k], out);
    }
  }
  return out;
}

function isPhotoField(key: string, value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (PHOTO_KEYS.has(key.toLowerCase()) && value.length > 40) return true;
  return isLikelyBase64Image(value);
}

function pickDeep(obj: unknown, keys: string[]): string | null {
  if (!isPlainObject(obj)) return null;
  const lower = new Map(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const v = lower.get(key.toLowerCase());
    if (v == null || v === "") continue;
    if (typeof v === "object") continue;
    return String(v);
  }
  for (const v of Object.values(obj)) {
    if (isPlainObject(v)) {
      const found = pickDeep(v, keys);
      if (found) return found;
    }
  }
  return null;
}

type TabDef = {
  id: string;
  label: string;
  kind: "overview" | "object" | "array" | "json";
  data?: unknown;
};

function buildTabs(report: Record<string, unknown>): TabDef[] {
  const tabs: TabDef[] = [{ id: "overview", label: "Overview", kind: "overview" }];
  for (const [key, value] of Object.entries(report)) {
    if (typeof value === "string" && isPhotoField(key, value)) continue;
    if (value == null || ["string", "number", "boolean"].includes(typeof value)) continue;
    if (isPlainObject(value)) {
      tabs.push({ id: `obj-${key}`, label: humanizeKey(key), kind: "object", data: value });
    } else if (Array.isArray(value)) {
      tabs.push({
        id: `arr-${key}`,
        label: `${humanizeKey(key)} (${value.length})`,
        kind: "array",
        data: value,
      });
    }
  }
  tabs.push({ id: "json", label: "Raw JSON", kind: "json" });
  return tabs;
}

function CompactGrid({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj).filter(
    ([k, v]) =>
      !(typeof v === "string" && isPhotoField(k, v)) &&
      (v == null || ["string", "number", "boolean"].includes(typeof v))
  );
  if (!entries.length) {
    return <p className="text-xs text-slate-500">No simple fields in this section.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-1.5"
        >
          <p className="truncate text-[10px] font-medium text-slate-400">{humanizeKey(k)}</p>
          <p
            className={cn(
              "mt-0.5 line-clamp-2 break-words text-xs font-medium text-slate-800",
              typeof v === "string" && v.length > 28 && "font-mono text-[10px] text-slate-600"
            )}
            title={formatDetailValue(v)}
          >
            {formatDetailValue(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

function NestedBlocks({ obj }: { obj: Record<string, unknown> }) {
  const children = Object.entries(obj).filter(
    ([, v]) => isPlainObject(v) || Array.isArray(v)
  );
  if (!children.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {children.map(([k, v]) => (
        <details
          key={k}
          className="group rounded-xl border border-slate-200 bg-white open:shadow-sm"
        >
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
              {humanizeKey(k)}
              {Array.isArray(v) ? (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {v.length}
                </span>
              ) : null}
            </span>
          </summary>
          <div className="border-t border-slate-100 px-3 py-2">
            {isPlainObject(v) ? (
              <>
                <CompactGrid obj={v} />
                <NestedBlocks obj={v} />
              </>
            ) : (
              <ArrayList items={v as unknown[]} />
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

function ArrayList({ items }: { items: unknown[] }) {
  if (!items.length) return <p className="text-xs text-slate-500">None</p>;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        if (isPlainObject(item)) {
          return (
            <details
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/50 open:bg-white"
            >
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
                Item #{idx + 1}
              </summary>
              <div className="border-t border-slate-100 px-3 py-2">
                <CompactGrid obj={item} />
                <NestedBlocks obj={item} />
              </div>
            </details>
          );
        }
        return (
          <div
            key={idx}
            className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
          >
            {formatDetailValue(item)}
          </div>
        );
      })}
    </div>
  );
}

function redactPhotosForDisplay(value: unknown): unknown {
  if (typeof value === "string") {
    if (isLikelyBase64Image(value)) {
      return `[base64 image, ${value.length} chars]`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactPhotosForDisplay);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && isPhotoField(k, v)) {
        out[k] = `[base64 image, ${v.length} chars]`;
      } else {
        out[k] = redactPhotosForDisplay(v);
      }
    }
    return out;
  }
  return value;
}

/** Compact tabbed CRB report viewer — less scrolling, jump between sections. */
export function CRBReportDrawerBody({ report }: { report: unknown }) {
  const photos = useMemo(() => collectPhotos(report), [report]);
  const tabs = useMemo(
    () => (isPlainObject(report) ? buildTabs(report) : []),
    [report]
  );
  const [tabId, setTabId] = useState("overview");
  const [photoFailed, setPhotoFailed] = useState<Record<string, boolean>>({});

  if (report == null) {
    return <p className="text-sm text-slate-500">No report data.</p>;
  }

  if (!isPlainObject(report)) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-800">
        {JSON.stringify(report, null, 2)}
      </pre>
    );
  }

  const active = tabs.find((t) => t.id === tabId) ?? tabs[0];
  const name = pickDeep(report, ["full_name", "names", "name"]);
  const score = pickDeep(report, ["credit_score", "score", "metro_score", "metropol_score"]);
  const pd = pickDeep(report, ["probability_of_default", "pd", "pd_percent"]);
  const nin = pickDeep(report, ["identity_number", "nin", "national_id"]);

  const overviewHighlights = HIGHLIGHT_KEYS.map((key) => {
    const val = pickDeep(report, [key]);
    return val ? { key, val } : null;
  }).filter(Boolean) as { key: string; val: string }[];
  // de-dupe by value+key
  const seen = new Set<string>();
  const uniqueHighlights = overviewHighlights.filter((h) => {
    const id = `${h.key}:${h.val}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const rootScalars = Object.fromEntries(
    Object.entries(report).filter(
      ([k, v]) =>
        !(typeof v === "string" && isPhotoField(k, v)) &&
        (v == null || ["string", "number", "boolean"].includes(typeof v))
    )
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky identity strip */}
      <div className="flex shrink-0 gap-3 border-b border-slate-100 bg-white px-4 py-3">
        {photos[0] && !photoFailed[photos[0].path] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[0].dataUrl}
            alt={photos[0].label}
            className="h-20 w-16 shrink-0 rounded-xl border border-slate-200 object-cover object-top"
            onError={() =>
              setPhotoFailed((prev) => ({ ...prev, [photos[0].path]: true }))
            }
          />
        ) : (
          <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
            No photo
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {name || "CRB subject"}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
            {nin || "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {score ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                Score {score}
              </span>
            ) : null}
            {pd ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                PD {pd}
              </span>
            ) : null}
            {photos.length > 1 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                {photos.length} photos
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabId(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              active?.id === t.id
                ? "bg-[#08163d] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* One section at a time */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {active?.kind === "overview" ? (
          <div className="space-y-3">
            {photos.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.slice(1).map((p) =>
                  photoFailed[p.path] ? null : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.path}
                      src={p.dataUrl}
                      alt={p.label}
                      title={p.label}
                      className="h-16 w-14 shrink-0 rounded-lg border border-slate-200 object-cover object-top"
                      onError={() =>
                        setPhotoFailed((prev) => ({ ...prev, [p.path]: true }))
                      }
                    />
                  )
                )}
              </div>
            ) : null}
            {uniqueHighlights.length ? (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Key fields
                </p>
                <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3 xl:grid-cols-4">
                  {uniqueHighlights.map((h) => (
                    <div
                      key={`${h.key}-${h.val}`}
                      className="rounded-lg border border-violet-100 bg-violet-50/40 px-2 py-1.5"
                    >
                      <p className="truncate text-[10px] text-violet-500">
                        {humanizeKey(h.key)}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-900">
                        {h.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Top-level fields
              </p>
              <CompactGrid obj={rootScalars} />
            </div>
            <p className="text-[11px] text-slate-500">
              Use the tabs above to open each report section without scrolling the whole
              document.
            </p>
          </div>
        ) : null}

        {active?.kind === "object" && isPlainObject(active.data) ? (
          <div>
            <CompactGrid obj={active.data} />
            <NestedBlocks obj={active.data} />
          </div>
        ) : null}

        {active?.kind === "array" && Array.isArray(active.data) ? (
          <ArrayList items={active.data} />
        ) : null}

        {active?.kind === "json" ? (
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-800">
            {JSON.stringify(redactPhotosForDisplay(report), null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
