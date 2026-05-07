"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { LoanProductForm } from "@/components/dashboard/loan-product-form";
import { useLoanProduct, useUpdateLoanProduct } from "@/hooks/use-loan";

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Edit loan product</h1>
      </div>
      <Card>
        <CardContent className="pt-4">
          {productQ.isLoading ? (
            <CompactLoading />
          ) : productQ.data ? (
            <LoanProductForm
              initial={productQ.data}
              isSaving={update.isPending}
              onSubmit={async (payload) => {
                await update.mutateAsync(payload);
                router.push("/loan-products");
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
