"use client";

import axios from "axios";
import { getSession } from "next-auth/react";
import { getApiBaseUrl } from "@/lib/config";
import { toast } from "sonner";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// Cache the JWT in module scope so we don't hit `/api/auth/session` on every
// outgoing request. `getSession()` from next-auth/react can serialize parallel
// callers behind a network round-trip and was the main cause of the UI feeling
// "frozen" when several queries fan out at once (page load, mutation refresh,
// etc.). We refresh the cache only when we don't have a token yet, or after a
// 401 from the server invalidates it.
let cachedToken: string | null = null;
let inflightSessionPromise: Promise<string | null> | null = null;

async function loadAccessToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (inflightSessionPromise) return inflightSessionPromise;

  inflightSessionPromise = (async () => {
    try {
      const session = await getSession();
      cachedToken = session?.accessToken ?? null;
      return cachedToken;
    } finally {
      inflightSessionPromise = null;
    }
  })();
  return inflightSessionPromise;
}

export function clearCachedAccessToken() {
  cachedToken = null;
  inflightSessionPromise = null;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await loadAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let authRedirectInFlight = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const code = (error.response?.data as { error?: { code?: string; message?: string } } | undefined)
      ?.error?.code;
    const message =
      (error.response?.data as { error?: { message?: string } } | undefined)?.error
        ?.message ?? "Request failed";
    const requestUrl = error.config?.url ?? "";

    if (code === "unauthorized" && !requestUrl.includes("/admin/auth/login")) {
      // Drop the cached token so the next attempt re-fetches the session.
      clearCachedAccessToken();
      if (!authRedirectInFlight) {
        authRedirectInFlight = true;
        toast.error("Session expired. Please sign in again.");
        window.location.assign("/auth/login");
      }
    } else if (code === "forbidden") {
      toast.error("You do not have permission for this action.");
    } else if (code === "conflict") {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
