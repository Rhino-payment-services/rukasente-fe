"use client";

import Link from "next/link";
import { BorrowerProvider } from "@/components/providers/borrower-provider";

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  return (
    <BorrowerProvider>
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex w-[95%] max-w-[1200px] items-center gap-4 py-3">
            <Link href="/borrower/loan-products" className="font-semibold">
              Borrower portal
            </Link>
            <Link href="/borrower/loan-products" className="text-sm text-muted-foreground">
              Products
            </Link>
            <Link href="/borrower/loan-applications" className="text-sm text-muted-foreground">
              Applications
            </Link>
          </div>
        </header>
        <main className="mx-auto w-[95%] max-w-[1200px] py-6">{children}</main>
      </div>
    </BorrowerProvider>
  );
}
