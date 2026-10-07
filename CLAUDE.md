# CLAUDE.md

Admin UI (Next.js App Router) + API (`server/`, see `server/CLAUDE.md`) for NSMK
(Novosadska Gradska Liga Mlađih Kategorija), a youth basketball league in Novi Sad, Serbia.

## Commands

```bash
npm run dev      # Start frontend dev server (port 3000)
npm run dev:api  # Start backend dev server (port 3001)
```

Both servers must be running for the admin UI to work.

No test framework is configured.

Postgres runs locally via Homebrew: `brew services start postgresql@16`.

## API contract

**`src/lib/axios.ts`** — Centralized axios instance. Reads `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:3001/api`). Sends httpOnly auth cookies (`withCredentials`) plus the `X-Requested-With` CSRF header, and on 401 calls `auth/refresh/` once and retries.

Auth (`server/src/middleware/auth.ts`): JWT access/refresh delivered as httpOnly cookies
(`nsmk_access` on `/api`, `nsmk_refresh` on `/api/auth` only). A Bearer header is
still accepted for scripts. Non-GET requests must send `X-Requested-With:
XMLHttpRequest` (CSRF guard).

Errors follow DRF conventions: `{ detail }` for general failures, `{ field: [msg] }`
for validation.

Not yet implemented (returns 501): CSV import/export and the computed league
endpoints (standings, leaders, results, schedule, team-stats, refresh-summaries).

`.env` sets `NEXT_PUBLIC_API_URL=http://localhost:3001/api/`; the frontend only
talks to the local backend in `server/`.

## Theme

Default dark palette: `#1c2440` / `#2a3555` background with `#e07b35` orange accent.
