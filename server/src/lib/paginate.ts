import type { Request } from 'express';

// Dropdowns (teams/leagues/clubs/seasons selects) fetch page 1 only and never
// follow `next`, so the default must comfortably exceed real row counts.
export const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(query: Request['query']): PageParams {
  const rawPage = Number(query.page);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const rawSize = Number(query.page_size);
  const pageSize =
    Number.isFinite(rawSize) && rawSize > 0
      ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function pageUrl(req: Request, page: number): string {
  const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
  url.searchParams.set('page', String(page));
  return url.toString();
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function paginated<T>(
  req: Request,
  { page, pageSize }: PageParams,
  count: number,
  results: T[],
): Paginated<T> {
  return {
    count,
    next: page * pageSize < count ? pageUrl(req, page + 1) : null,
    previous: page > 1 ? pageUrl(req, page - 1) : null,
    results,
  };
}
