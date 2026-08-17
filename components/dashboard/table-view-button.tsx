"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TableViewButton({
  onClick,
  disabled,
  label = "View details",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      title={label}
      aria-label={label}
      className="h-7 gap-1 rounded-md px-2 text-[11px]"
      disabled={disabled}
      onClick={onClick}
    >
      <Eye className="size-3" />
      View
    </Button>
  );
}
