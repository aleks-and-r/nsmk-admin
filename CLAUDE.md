# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

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

### Environment

`.env.local` holds `NEXT_PUBLIC_API_URL`. The current value points to a Cloudflare tunnel URL used for local development against a remote backend.
