"use client";

import type { ReactNode } from "react";
import type { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { CompactLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export type CompactTableShellProps<TData> = {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  minWidth?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function CompactTableShell<TData>({
  table,
  columns,
  isLoading,
  error,
  emptyMessage = "No records found.",
  minWidth = "680px",
  toolbar,
  footer,
  className,
}: CompactTableShellProps<TData>) {
  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}

      {isLoading ? (
        <div className="py-6">
          <CompactLoading />
        </div>
      ) : error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs"
            style={{ minWidth }}
          >
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400 whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/90"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 align-middle text-slate-700"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-10 text-center text-xs text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {footer}
    </div>
  );
}
