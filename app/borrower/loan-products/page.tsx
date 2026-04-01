"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBorrowerContext } from "@/components/providers/borrower-provider";
import { useBorrowerLoanProducts } from "@/hooks/use-loan";

export default function BorrowerLoanProductsPage() {
  const { rukapayUserId } = useBorrowerContext();
  const productsQ = useBorrowerLoanProducts(rukapayUserId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Available loan products</h1>
      {productsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(productsQ.data ?? []).map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2 pt-4">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.description || "—"}</p>
              <p className="text-sm">Amount: {p.min_amount} - {p.max_amount} {p.currency}</p>
              <p className="text-sm">Tenor: {p.min_tenor_days} - {p.max_tenor_days} days</p>
              <p className="text-sm">Interest: {p.interest_rate} ({p.interest_type})</p>
              <p className="text-sm">Manual review: {p.requires_manual_review ? "Yes" : "No"}</p>
              <Button asChild size="sm">
                <Link href={`/borrower/loan-products/${p.id}/apply`}>Apply</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
