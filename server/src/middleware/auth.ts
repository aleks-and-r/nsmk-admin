import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { ApiError, unauthorized } from '../lib/errors.js';

export interface AuthedRequest extends Request {
  userId?: number;
}

export const ACCESS_COOKIE = 'nsmk_access';
export const REFRESH_COOKIE = 'nsmk_refresh';

// The refresh cookie is only sent to the auth endpoints, never to regular API calls.
const ACCESS_PATH = '/api';
const REFRESH_PATH = '/api/auth';

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: String(userId), type: 'access' }, env.accessSecret, {
    expiresIn: env.accessTtl,
  } as jwt.SignOptions);
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: String(userId), type: 'refresh' }, env.refreshSecret, {
    expiresIn: env.refreshTtl,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string | undefined): number {
  if (!token) throw unauthorized('Token is invalid or expired');
  try {
    const payload = jwt.verify(token, env.refreshSecret) as jwt.JwtPayload;
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    return Number(payload.sub);
  } catch {
    throw unauthorized('Token is invalid or expired');
  }
}

function cookieOptions(path: string): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path,
  };
}

// Cookie lifetime mirrors the token's own `exp`, so TTL is configured in one place.
function expiresOf(token: string): Date {
  const { exp } = jwt.decode(token) as jwt.JwtPayload;
  return new Date(exp! * 1000);
}

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, { ...cookieOptions(ACCESS_PATH), expires: expiresOf(token) });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(REFRESH_PATH), expires: expiresOf(token) });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(ACCESS_PATH));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(REFRESH_PATH));
}

/**
 * CSRF guard: a cross-site page can make the browser send our cookies with a
 * plain form POST, but it cannot add a custom header without passing CORS.
 */
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(new ApiError(403, 'CSRF check failed.'));
  }
  return next();
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  // Bearer header kept as a fallback for scripts / curl.
  const header = req.headers.authorization;
  const token: string | undefined =
    req.cookies?.[ACCESS_COOKIE] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) {
    return next(unauthorized());
  }

  try {
    const payload = jwt.verify(token, env.accessSecret) as jwt.JwtPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return next(unauthorized('Given token not valid for any token type'));
  }
}
