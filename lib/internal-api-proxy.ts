import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config";

const PROXY_TIMEOUT_MS = 50_000;

export async function proxyInternalRequest(
  endpoint: string,
  init?: RequestInit
) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  const internalKey = process.env.RUKA_INTERNAL_API_KEY ?? "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  init?.signal?.addEventListener("abort", onCallerAbort);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
        "X-Internal-API-Key": internalKey,
      },
      cache: "no-store",
    });

    const payload = await res.json();
    return NextResponse.json(payload, { status: res.status });
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name?: string }).name === "AbortError");
    if (aborted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "timeout",
            message:
              "Upstream scoring request timed out. Is rukasente-be running?",
          },
        },
        { status: 504 }
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", onCallerAbort);
  }
}

