import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/config";

/** Stable dev-only secret so JWT cookies encrypt/decrypt when .env is incomplete. Never use in production. */
const DEV_FALLBACK_NEXTAUTH_SECRET =
  "rukasente-fe-dev-only-set-NEXTAUTH_SECRET-in-env-local";

function resolveNextAuthSecret(): string {
  const s = process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "development") {
    if (typeof console !== "undefined") {
      console.warn(
        "[next-auth] NEXTAUTH_SECRET is missing; using a fixed dev fallback. Add NEXTAUTH_SECRET to .env.local (e.g. openssl rand -base64 32). Clear site cookies if you still see JWT_SESSION_ERROR after setting it."
      );
    }
    return DEV_FALLBACK_NEXTAUTH_SECRET;
  }
  return "";
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type LoginData = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  refresh_token: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    permissions?: string[];
    roles?: Array<{
      id: string;
      name: string;
      description?: string;
      is_system: boolean;
    }>;
  };
};

type RefreshData = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
};

async function refreshAccessToken(token: {
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: number;
}) {
  if (!token.refreshToken) {
    return { ...token, authError: "missing_refresh_token" as const };
  }

  try {
    const base = getApiBaseUrl();
    const { data: envelope } = await axios.post<Envelope<RefreshData>>(
      `${base}/admin/auth/refresh`,
      { refresh_token: token.refreshToken },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );

    if (!envelope.success || !envelope.data?.access_token) {
      return { ...token, authError: "refresh_failed" as const };
    }

    return {
      ...token,
      accessToken: envelope.data.access_token,
      refreshToken: envelope.data.refresh_token,
      expiresInSeconds: envelope.data.expires_in_seconds,
      expiresAt: Math.floor(Date.now() / 1000) + envelope.data.expires_in_seconds,
      authError: undefined,
    };
  } catch {
    return { ...token, authError: "refresh_failed" as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "rukasente-staff",
      name: "Staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        try {
          const base = getApiBaseUrl();
          const { data: envelope } = await axios.post<Envelope<LoginData>>(
            `${base}/admin/auth/login`,
            {
              email: credentials.email,
              password: credentials.password,
            },
            { headers: { "Content-Type": "application/json" }, timeout: 30000 }
          );

          if (!envelope.success || !envelope.data?.access_token) {
            throw new Error(
              envelope.error?.message || "Invalid email or password"
            );
          }

          const d = envelope.data;
          return {
            id: d.user.id,
            email: d.user.email,
            name: d.user.full_name,
            accessToken: d.access_token,
            refreshToken: d.refresh_token,
            expiresInSeconds: d.expires_in_seconds,
            permissions: d.user.permissions ?? [],
            roles: d.user.roles ?? [],
          };
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const env = err.response?.data as Envelope<unknown> | undefined;
            const msg =
              env?.error?.message ||
              (typeof err.response?.data === "object" &&
              err.response?.data !== null &&
              "message" in err.response.data
                ? String(
                    (err.response.data as { message?: string }).message
                  )
                : undefined) ||
              err.message;
            throw new Error(msg || "Login failed");
          }
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          accessToken?: string;
          refreshToken?: string;
          expiresInSeconds?: number;
          permissions?: string[];
          roles?: unknown[];
        };
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.expiresInSeconds = u.expiresInSeconds;
        token.permissions = u.permissions ?? [];
        token.roles = u.roles as typeof token.roles;
        token.sub = u.id;
        if (typeof u.expiresInSeconds === "number" && u.expiresInSeconds > 0) {
          const expSeconds = Math.floor(Date.now() / 1000) + u.expiresInSeconds;
          token.exp = expSeconds;
          token.expiresAt = expSeconds;
        }
        return token;
      }

      const expiresAt =
        typeof token.expiresAt === "number" ? token.expiresAt : token.exp;
      const needsRefresh =
        typeof expiresAt === "number" && Date.now() / 1000 > expiresAt - 60;

      if (needsRefresh) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || "";
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.roles = token.roles ?? [];
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string | undefined;
        session.authError = token.authError as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: resolveNextAuthSecret(),
  debug: process.env.NEXTAUTH_DEBUG === "true",
};
