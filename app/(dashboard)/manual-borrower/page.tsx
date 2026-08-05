"use client";

import { ManualBorrowerOnboarding } from "@/components/dashboard/manual-borrower-onboarding";
import { RequirePerm } from "@/components/auth/require-perm";
import { Perm } from "@/lib/permissions";

export default function ManualBorrowerPage() {
  return (
    <RequirePerm
      anyOf={[Perm.BorrowerView]}
      description="You need borrower.view to register borrowers."
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <ManualBorrowerOnboarding />
      </div>
    </RequirePerm>
  );
}
