"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageLoading } from "@/components/ui/loading";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <FullPageLoading message="Preparing your workspace..." />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
