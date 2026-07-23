"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2 text-slate-500">
          <Link href="/loan-products">
            <ArrowLeft className="size-3.5" />
            Loan products
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Edit loan product
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update pricing and controls. Existing loans keep the interest method they were created with.
        </p>
      </div>
      <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
        <CardContent className="p-5">
          {productQ.isLoading ? (
            <CompactLoading />
          ) : productQ.data ? (
            <LoanProductForm
              initial={productQ.data}
              isSaving={update.isPending}
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
            <p className="text-sm text-muted-foreground">Product not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
