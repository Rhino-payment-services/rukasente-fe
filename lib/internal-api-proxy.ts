import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config";

export async function proxyInternalRequest(
  endpoint: string,
  init?: RequestInit
) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  const internalKey = process.env.RUKA_INTERNAL_API_KEY ?? "";

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      "X-Internal-API-Key": internalKey,
    },
    cache: "no-store",
  });

  const payload = await res.json();
  return NextResponse.json(payload, { status: res.status });
}

