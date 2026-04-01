"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CompactLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  error,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <CompactLoading />;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b text-left">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
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
                className="hover:bg-muted/50 border-b transition-colors last:border-0"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 align-middle whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-3 py-8 text-center text-sm text-muted-foreground"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
