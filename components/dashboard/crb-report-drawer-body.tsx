"use client";

import { DetailField, DetailGrid, DetailSection, formatDetailValue } from "@/components/dashboard/detail-fields";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function scalarFields(obj: Record<string, unknown>) {
  return Object.entries(obj)
    .filter(([, v]) => v == null || ["string", "number", "boolean"].includes(typeof v))
    .map(([k, v]) => ({
      label: humanizeKey(k),
      value: formatDetailValue(v),
      mono: typeof v === "string" && v.length > 24,
      fullWidth: typeof v === "string" && v.length > 48,
    }));
}

function nestedObjects(obj: Record<string, unknown>) {
  return Object.entries(obj).filter(([, v]) => isPlainObject(v)) as [string, Record<string, unknown>][];
}

function nestedArrays(obj: Record<string, unknown>) {
  return Object.entries(obj).filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];
}

/** Large structured view of a Metropol CRB report (all fields). */
export function CRBReportDrawerBody({ report }: { report: unknown }) {
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

  const scalars = scalarFields(report);
  const objects = nestedObjects(report);
  const arrays = nestedArrays(report);

  return (
    <div className="space-y-5">
      {scalars.length ? (
        <DetailSection title="Report summary">
          <DetailGrid fields={scalars} />
        </DetailSection>
      ) : null}

      {objects.map(([key, value]) => {
        const fields = scalarFields(value);
        const childObjects = nestedObjects(value);
        const childArrays = nestedArrays(value);
        return (
          <DetailSection key={key} title={humanizeKey(key)}>
            {fields.length ? <DetailGrid fields={fields} /> : null}
            {childObjects.map(([ck, cv]) => (
              <div key={ck} className="mt-2 space-y-1">
                <p className="text-[11px] font-medium text-slate-500">{humanizeKey(ck)}</p>
                <DetailGrid fields={scalarFields(cv)} />
                {nestedArrays(cv).map(([ak, av]) => (
                  <ArrayBlock key={ak} title={humanizeKey(ak)} items={av} />
                ))}
              </div>
            ))}
            {childArrays.map(([ak, av]) => (
              <ArrayBlock key={ak} title={humanizeKey(ak)} items={av} />
            ))}
            {!fields.length && !childObjects.length && !childArrays.length ? (
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-700">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : null}
          </DetailSection>
        );
      })}

      {arrays.map(([key, items]) => (
        <ArrayBlock key={key} title={humanizeKey(key)} items={items} />
      ))}

      <DetailSection title="Full report JSON">
        <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-800">
          {JSON.stringify(report, null, 2)}
        </pre>
      </DetailSection>
    </div>
  );
}

function ArrayBlock({ title, items }: { title: string; items: unknown[] }) {
  return (
    <DetailSection title={`${title} (${items.length})`}>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">None</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            if (isPlainObject(item)) {
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {title} #{idx + 1}
                  </p>
                  <DetailGrid fields={scalarFields(item)} />
                  {nestedObjects(item).map(([ck, cv]) => (
                    <div key={ck} className="mt-2">
                      <p className="mb-1 text-[11px] font-medium text-slate-500">
                        {humanizeKey(ck)}
                      </p>
                      <DetailGrid fields={scalarFields(cv)} />
                    </div>
                  ))}
                  {nestedArrays(item).length ? (
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600">
                      {JSON.stringify(
                        Object.fromEntries(nestedArrays(item)),
                        null,
                        2
                      )}
                    </pre>
                  ) : null}
                </div>
              );
            }
            return (
              <DetailField
                key={idx}
                label={`${title} #${idx + 1}`}
                value={formatDetailValue(item)}
                fullWidth
              />
            );
          })}
        </div>
      )}
    </DetailSection>
  );
}
