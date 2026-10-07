# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start frontend dev server (port 3000)
npm run dev:api  # Start backend dev server (port 3001)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

Both servers must be running for the admin UI to work.

No test framework is configured.

### Backend commands (`server/`)

```bash
npm --prefix server run prisma:migrate   # Create/apply a migration
npm --prefix server run prisma:studio    # Browse the DB
npm --prefix server run seed             # Seed admin user + sample data
```

Postgres runs locally via Homebrew: `brew services start postgresql@16`.

## Architecture

**Next.js 16 App Router** frontend for NSMK (Novosadska Gradska Liga Mlađih Kategorija), a youth basketball league in Novi Sad, Serbia.

### Stack

- React 19, TypeScript 5, Tailwind CSS 4
- TanStack React Query 5 for server state
- Axios for API calls
- next-themes for dark/light mode

### Layer Structure

**`src/lib/axios.ts`** — Centralized axios instance. Reads `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:3001/api`). Injects auth token from localStorage and skips ngrok browser warnings.

**`src/services/`** — API service functions (clubs, matches, players, seasons, teams).

**`src/hooks/queries/`** — React Query custom hooks wrapping the services. Global config: 5-minute stale time, 1 retry.

**`src/providers/`** — `QueryProvider.tsx` and `ThemeProvider.tsx` (both wrapped in `app/layout.tsx`).

**`src/components/`** — `PageLayout.tsx` (shared banner/wrapper), `Navigation.tsx` (sticky header), `ThemeToggle.tsx`.

### Path Aliases

`@/*` maps to `./src/*`.

### Routing (App Router)

- `/` — Home (placeholder)
- `/clubs` — Clubs list with stats
- `/matches` — Match results
- `/players` — Player database
- `/o_nama` — About page

Several navigation links in `Navigation.tsx` point to unimplemented routes (schedule, gallery, bulletins, documents, contact).

### Theme

Default dark palette: `#1c2440` / `#2a3555` background with `#e07b35` orange accent.

## Backend (`server/`)

Express 4 + TypeScript + Prisma/PostgreSQL, serving the DRF-shaped API the frontend
was originally written against. Mounted at `/api`; uploads served from `/media`.

- **`prisma/schema.prisma`** — models for clubs, coaches, players, seasons, leagues,
  rounds, teams, venues, games, memberships and per-game player stats.
- **`src/serializers/`** — snake_case response shapes plus computed fields
  (`full_name`, `club_name`, `points`, `quarter_scores_display`, …). Shared by list
  and detail handlers so the two never drift.
- **`src/routes/`** — one router per resource.
- **`src/lib/paginate.ts`** — the only place the `{count,next,previous,results}`
  envelope is built. Page size is constant (default 100) because `DataTable` infers
  it from the response and dropdowns read page 1 only.
- **`src/middleware/auth.ts`** — JWT access/refresh, matching simplejwt's contract.

Errors follow DRF conventions: `{ detail }` for general failures, `{ field: [msg] }`
for validation.

Not yet implemented (returns 501): CSV import/export and the computed league
endpoints (standings, leaders, results, schedule, team-stats, refresh-summaries).

### Environment

`.env` holds the remote `NEXT_PUBLIC_API_URL`; `.env.local` overrides it with
`http://localhost:3001/api/` to target the local backend. Delete `.env.local` to
point the frontend back at the remote API.

`server/.env` holds `DATABASE_URL`, the JWT secrets, `PORT` and `CORS_ORIGIN`
(comma-separated list of allowed frontend origins).
