# Ruka Sente (admin frontend)

Staff admin UI for [rukasente-be](https://github.com/) (`/api/v1/admin/*`): Next.js App Router, NextAuth (credentials → JWT), TanStack Query, and RBAC from `user.permissions`.

## Setup

1. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

2. Set **`NEXTAUTH_SECRET`** (required for stable sessions in any environment; e.g. `openssl rand -base64 32`), **`NEXTAUTH_URL`** (e.g. `http://localhost:3000`; a default is applied in `next.config.ts` if omitted), and **`NEXT_PUBLIC_API_URL`** pointing at **rukasente-be** (e.g. `http://localhost:8080/api/v1` — must match the API’s `/api/v1` base path).

3. Ensure **rukasente-be** is running and allows this origin in CORS (e.g. `http://localhost:3000` for `yarn dev`). Login calls `POST {NEXT_PUBLIC_API_URL}/admin/auth/login`; sign-out calls `POST .../admin/auth/logout`; authenticated requests send `Authorization: Bearer <access_token>` from the NextAuth session.

4. Install and run (this repo uses **Yarn**; `yarn.lock` is the source of truth):

   ```bash
   yarn install
   yarn dev
   ```

Open [http://localhost:3000](http://localhost:3000), sign in at `/auth/login`, then use the dashboard.

## Troubleshooting

- **`JWT_SESSION_ERROR` / “decryption operation failed”** — Usually an old session cookie encrypted with a different `NEXTAUTH_SECRET`. Set `NEXTAUTH_SECRET` in `.env.local`, restart the dev server, and **clear cookies** for `localhost:3000` (or use a private window), then sign in again.
- **`NEXTAUTH_URL` / `NO_SECRET` warnings** — Add `NEXTAUTH_URL` and `NEXTAUTH_SECRET` to `.env.local`. For verbose NextAuth logs, set `NEXTAUTH_DEBUG=true`.

## Scripts

- `yarn dev` — development server
- `yarn build` — production build
- `yarn start` — production server
- `yarn lint` — ESLint
