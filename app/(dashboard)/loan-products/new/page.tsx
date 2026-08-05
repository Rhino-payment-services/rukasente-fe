"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanProductForm } from "@/components/dashboard/loan-product-form";
import { useCreateLoanProduct } from "@/hooks/use-loan";
import { toast } from "sonner";

export default function NewLoanProductPage() {
  const router = useRouter();
  const create = useCreateLoanProduct();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="space-y-4">
        <nav className="flex items-center gap-1.5 text-[13px] text-slate-400">
          <Link href="/loan-products" className="transition-colors hover:text-slate-700">
            Loan products
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-700">Create</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
              Create Loan Product
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Configure pricing, limits, and fees for a new lending product. Progress is auto-saved
              as a draft while you work.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl text-slate-600"
              onClick={() => router.push("/loan-products")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200"
              disabled={create.isPending}
              onClick={() => {
                document.getElementById("loan-product-save-draft")?.click();
              }}
            >
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      <LoanProductForm
        isSaving={create.isPending}
        onCancel={() => router.push("/loan-products")}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Loan product created");
            router.push("/loan-products");
          } catch (err) {
            toast.error((err as Error).message || "Failed to create product");
          }
        }}
      />
    </div>
  );
}
