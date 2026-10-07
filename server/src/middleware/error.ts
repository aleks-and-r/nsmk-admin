import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';

/** Express 4 does not catch rejected promises from async handlers. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ detail: 'Not found.' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    // DRF-style field errors: { field: ["message"] }
    const fields: Record<string, string[]> = {};
    for (const issue of err.errors) {
      const key = issue.path.join('.') || 'non_field_errors';
      (fields[key] ??= []).push(issue.message);
    }
    return res.status(400).json(fields);
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ detail: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ detail: 'Not found.' });
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return res.status(400).json({ detail: `A record with this ${target} already exists.` });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ detail: 'Referenced record does not exist.' });
    }
  }

  console.error(err);
  return res.status(500).json({ detail: 'Internal server error.' });
}
