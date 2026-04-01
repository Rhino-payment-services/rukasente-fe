"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LoanProductForm } from "@/components/dashboard/loan-product-form";
import { useCreateLoanProduct } from "@/hooks/use-loan";

export default function NewLoanProductPage() {
  const router = useRouter();
  const create = useCreateLoanProduct();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Create loan product</h1>
        <p className="text-sm text-muted-foreground">Define pricing, tenor and product controls.</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <LoanProductForm
            isSaving={create.isPending}
            onSubmit={async (payload) => {
              await create.mutateAsync(payload);
              router.push("/loan-products");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
