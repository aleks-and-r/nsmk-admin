import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { unauthorized } from '../lib/errors.js';

export interface AuthedRequest extends Request {
  userId?: number;
}

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

export function verifyRefreshToken(token: string): number {
  try {
    const payload = jwt.verify(token, env.refreshSecret) as jwt.JwtPayload;
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    return Number(payload.sub);
  } catch {
    throw unauthorized('Token is invalid or expired');
  }
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized());
  }

  try {
    const payload = jwt.verify(header.slice(7), env.accessSecret) as jwt.JwtPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return next(unauthorized('Given token not valid for any token type'));
  }
}
