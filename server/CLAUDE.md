# server/CLAUDE.md

Express 4 + TypeScript + Prisma/PostgreSQL, serving the DRF-shaped API the frontend
was originally written against. Mounted at `/api`; uploads served from `/media`.

## Commands

```bash
npm --prefix server run prisma:migrate   # Create/apply a migration
npm --prefix server run prisma:studio    # Browse the DB
npm --prefix server run seed             # Seed admin user + sample data
```

## Conventions

- **`src/serializers/`** — snake_case response shapes plus computed fields
  (`full_name`, `club_name`, `points`, `quarter_scores_display`, …). Shared by list
  and detail handlers so the two never drift.
- **`src/lib/paginate.ts`** — the only place the `{count,next,previous,results}`
  envelope is built. Page size is constant (default 100) because `DataTable` infers
  it from the response and dropdowns read page 1 only.

## Environment

`server/.env` holds `DATABASE_URL`, the JWT secrets, `PORT` and `CORS_ORIGIN`
(comma-separated list of allowed frontend origins). Optional `COOKIE_SAMESITE`
(`lax` default; `none` when frontend and API are on different sites) and
`COOKIE_SECURE` (defaults to true in production or with `SameSite=None`).
