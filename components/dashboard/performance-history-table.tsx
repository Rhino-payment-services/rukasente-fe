"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  ["#1", "macOS", "3.23s", "0.055", "306ms", "405ms"],
  ["#2", "Windows", "3.43s", "0.031", "120ms", "416ms"],
  ["#3", "Android", "2.08s", "0.048", "204ms", "331ms"],
];

export function PerformanceHistoryTable() {
  return (
    <Card className="gap-0 border-slate-200 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-4">
        <CardTitle className="text-sm">Performance history</CardTitle>
        <span className="text-xs text-slate-500">Last 7 days</span>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">No</th>
                <th className="px-2 py-2 font-medium">Operating system</th>
                <th className="px-2 py-2 font-medium">LCP</th>
                <th className="px-2 py-2 font-medium">CLS</th>
                <th className="px-2 py-2 font-medium">INP</th>
                <th className="px-2 py-2 font-medium">TTFB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100 text-slate-700">
                  {row.map((cell, idx) => (
                    <td key={idx} className="px-2 py-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

