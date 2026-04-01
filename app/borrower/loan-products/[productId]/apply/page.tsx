"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBorrowerContext } from "@/components/providers/borrower-provider";
import { useBorrowerLoanProducts, useCreateBorrowerLoanApplication } from "@/hooks/use-loan";

export default function BorrowerApplyPage({ params }: { params: { productId: string } }) {
  const router = useRouter();
  const { rukapayUserId } = useBorrowerContext();
  const productsQ = useBorrowerLoanProducts(rukapayUserId);
  const create = useCreateBorrowerLoanApplication();
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");

  const product = (productsQ.data ?? []).find((p) => p.id === params.productId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!product) return;
    const requestedAmount = Number(amount);
    const requestedTenorDays = Number(tenor);
    if (requestedAmount < product.min_amount || requestedAmount > product.max_amount) {
      setError("Requested amount must be within product range.");
      return;
    }
    if (requestedTenorDays < product.min_tenor_days || requestedTenorDays > product.max_tenor_days) {
      setError("Requested tenor must be within product range.");
      return;
    }
    await create.mutateAsync({
      rukapay_user_id: rukapayUserId,
      loan_product_id: product.id,
      requested_amount: requestedAmount,
      requested_tenor_days: requestedTenorDays,
      purpose,
      submission_channel: "web",
    });
    router.push("/borrower/loan-applications");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Apply for loan</h1>
      <Card>
        <CardContent className="pt-4">
          {!product ? (
            <p className="text-sm text-muted-foreground">Product not found or not eligible.</p>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <p className="text-sm text-muted-foreground">
                {product.name} ({product.currency}) - Amount {product.min_amount} to {product.max_amount}, tenor {product.min_tenor_days} to {product.max_tenor_days} days.
              </p>
              <Input type="number" placeholder="Requested amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input type="number" placeholder="Requested tenor days" value={tenor} onChange={(e) => setTenor(e.target.value)} />
              <Input placeholder="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Submitting..." : "Submit application"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
