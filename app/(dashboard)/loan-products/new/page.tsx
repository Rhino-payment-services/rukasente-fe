"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoanProductForm } from "@/components/dashboard/loan-product-form";
import { useCreateLoanProduct } from "@/hooks/use-loan";
import { toast } from "sonner";

export default function NewLoanProductPage() {
  const router = useRouter();
  const create = useCreateLoanProduct();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2 text-slate-500">
            <Link href="/loan-products">
              <ArrowLeft className="size-3.5" />
              Loan products
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create loan product
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Set up pricing in four short steps — basics, limits, interest, then fees.
          </p>
        </div>
      </div>
      <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
        <CardContent className="p-5">
          <LoanProductForm
            isSaving={create.isPending}
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
        </CardContent>
      </Card>
    </div>
  );
}
