import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // NextAuth warns if unset; local dev defaults to the usual Next port
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  },
};

export default nextConfig;
