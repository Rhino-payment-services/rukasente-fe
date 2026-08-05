import "next-auth";
import "next-auth/jwt";

export type StaffRoleRef = {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
};

/** Compact partner/tenant projection from login/me. */
export type PartnerSessionSummary = {
  id: string;
  name: string;
  code: string;
  is_internal: boolean;
  logo_url?: string;
  primary_color?: string;
  currency?: string;
};

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
    expiresInSeconds?: number;
    permissions?: string[];
    roles?: StaffRoleRef[];
    partnerId?: string | null;
    isPlatform?: boolean;
    partner?: PartnerSessionSummary | null;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    authError?: string;
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      permissions: string[];
      roles?: StaffRoleRef[];
      partnerId?: string | null;
      isPlatform?: boolean;
      partner?: PartnerSessionSummary | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    permissions?: string[];
    roles?: StaffRoleRef[];
    expiresInSeconds?: number;
    expiresAt?: number;
    authError?: string;
    partnerId?: string | null;
    isPlatform?: boolean;
    partner?: PartnerSessionSummary | null;
  }
}
