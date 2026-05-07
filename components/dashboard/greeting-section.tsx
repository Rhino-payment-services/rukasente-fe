"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GreetingSection({ fullName }: { fullName?: string | null }) {
  const firstName = fullName?.split(" ")[0] ?? "System";

  return (
    <Card className="gap-0 border-slate-200 bg-white py-0 shadow-none">
      <CardContent className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Good morning, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your operations snapshot in one dashboard.
          </p>
        </div>
        <Button size="sm" className="h-9 gap-2 bg-main-600 text-white hover:bg-main-700">
          <Share2 className="size-3.5" />
          Share
        </Button>
      </CardContent>
    </Card>
  );
}

