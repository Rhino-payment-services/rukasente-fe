"use client";

import axios from "axios";
import { apiClient } from "@/lib/api-client";

export type LoanExportFilters = {
  from?: string;
  to?: string;
  status?: string;
  partner_id?: string;
  product_id?: string;
  borrower_id?: string;
};

function parseContentDispositionFilename(header?: string): string | null {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function parseBlobError(error: unknown): Promise<Error> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const body = JSON.parse(text) as { error?: { message?: string } };
      if (body.error?.message) {
        return new Error(body.error.message);
      }
    } catch {
      // fall through
    }
  }
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: { message?: string } } | undefined;
    if (body?.error?.message) {
      return new Error(body.error.message);
    }
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("Export failed");
}

export function defaultLoanExportDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export async function downloadLoanExport(
  kind: "book" | "repayments",
  params: LoanExportFilters
) {
  const path =
    kind === "book"
      ? "/admin/loan-exports/book"
      : "/admin/loan-exports/repayments";
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const v = String(value ?? "").trim();
    if (v) cleaned[key] = v;
  }
  try {
    const res = await apiClient.get(path, {
      params: cleaned,
      responseType: "blob",
    });
    const blob = res.data as Blob;
    const fallback =
      kind === "book"
        ? `loan-book-${new Date().toISOString().slice(0, 10)}.csv`
        : `loan-repayments-${new Date().toISOString().slice(0, 10)}.csv`;
    const filename =
      parseContentDispositionFilename(
        res.headers["content-disposition"] as string | undefined
      ) ?? fallback;
    triggerBlobDownload(blob, filename);
  } catch (error) {
    throw await parseBlobError(error);
  }
}
