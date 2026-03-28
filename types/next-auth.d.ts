import "next-auth";
import "next-auth/jwt";

export type StaffRoleRef = {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
};

declare module "next-auth" {
  interface User {
    accessToken?: string;
    expiresInSeconds?: number;
    permissions?: string[];
    roles?: StaffRoleRef[];
  }

  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      permissions: string[];
      roles?: StaffRoleRef[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    permissions?: string[];
    roles?: StaffRoleRef[];
    expiresInSeconds?: number;
  }
}
