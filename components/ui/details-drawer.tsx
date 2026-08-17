"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientMounted } from "@/lib/use-client-mounted";
import { cn } from "@/lib/utils";

export type DetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
};

export function DetailsDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "max-w-md",
}: DetailsDrawerProps) {
  const mounted = useClientMounted();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl outline-none animate-in slide-in-from-right duration-200",
          widthClassName
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0 pr-3">
            <h2 id={titleId} className="text-sm font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 rounded-lg"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {footer ? (
          <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 py-3">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}
