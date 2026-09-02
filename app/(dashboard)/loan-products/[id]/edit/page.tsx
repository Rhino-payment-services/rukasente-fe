"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { LoanProductForm } from "@/components/dashboard/loan-product-form";
import { useLoanProduct, useUpdateLoanProduct } from "@/hooks/use-loan";
import { toast } from "sonner";

export default function EditLoanProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const productQ = useLoanProduct(id);
  const update = useUpdateLoanProduct(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="space-y-4">
        <nav className="flex items-center gap-1.5 text-[13px] text-slate-400">
          <Link href="/loan-products" className="transition-colors hover:text-slate-700">
            Loan products
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-700">Edit</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
              Edit Loan Product
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Update pricing and controls. Existing loans keep the interest method they were created
              with.
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
              disabled={update.isPending || productQ.isLoading}
              onClick={() => {
                document.getElementById("loan-product-save-draft")?.click();
              }}
            >
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      {productQ.isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 shadow-sm">
          <CompactLoading />
        </div>
      ) : productQ.data ? (
        <LoanProductForm
          key={id}
          initial={productQ.data}
          isSaving={update.isPending}
          onCancel={() => router.push("/loan-products")}
          onSaveDraft={async (payload) => {
            try {
              await update.mutateAsync(payload);
              toast.success("Product saved as inactive draft");
              router.push("/loan-products");
            } catch (err) {
              toast.error((err as Error).message || "Failed to save draft");
            }
          }}
          onSubmit={async (payload) => {
            try {
              await update.mutateAsync(payload);
              toast.success("Loan product updated");
              router.push("/loan-products");
            } catch (err) {
              toast.error((err as Error).message || "Failed to update product");
            }
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Product not found.
        </div>
      )}
    </div>
  );
}
