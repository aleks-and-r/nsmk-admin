import type { Request } from 'express';
import { ApiError } from './errors.js';

function nest(path: string, leaf: unknown): Record<string, unknown> {
  return path
    .split('.')
    .reduceRight<unknown>((acc, key) => ({ [key]: acc }), leaf) as Record<string, unknown>;
}

/** Builds a Prisma OR filter over dotted field paths, e.g. "club.name". */
export function buildSearch(search: unknown, fields: string[]) {
  if (typeof search !== 'string' || !search.trim()) return undefined;
  const contains = { contains: search.trim(), mode: 'insensitive' as const };
  return { OR: fields.map((field) => nest(field, contains)) };
}

export function intParam(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && value !== '' && value != null ? Math.floor(n) : undefined;
}

export function boolParam(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

export function idParam(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(404, 'Not found.');
  return id;
}
