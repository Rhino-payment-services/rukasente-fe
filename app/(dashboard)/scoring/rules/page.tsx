"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyScoringRulesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/credit-score/rules");
  }, [router]);
  return (
    <p className="text-sm text-muted-foreground">Redirecting to Credit Score Rules…</p>
  );
}
