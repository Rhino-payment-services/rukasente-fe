"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/scoring/rules", label: "Scoring rules" },
  { href: "/scoring/results", label: "Score results" },
  { href: "/scoring/eligibility", label: "Eligibility decisions" },
  { href: "/scoring/manual-review", label: "Manual review cases" },
];

export function ScoringNav() {
  const pathname = usePathname();
  const current = items.find((item) => item.href === pathname);

  return (
    <details className="w-full rounded-md border border-border bg-white">
      <summary className="cursor-pointer list-none px-4 py-2 text-sm font-medium text-[#08163d]">
        Scoring pages:{" "}
        <span className="text-muted-foreground">
          {current?.label ?? "Pick a page"}
        </span>
      </summary>
      <div className="border-t border-border p-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-main-50 text-main-700"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
