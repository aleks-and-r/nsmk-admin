import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ApiError, unauthorized } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  requireAuth,
  setAccessCookie,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AuthedRequest,
} from '../middleware/auth.js';
import { serializeUser } from '../serializers/index.js';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post(
  '/auth/login/',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) {
      throw unauthorized('No active account found with the given credentials');
    }

    // Tokens travel only as httpOnly cookies; the body carries the profile.
    setAccessCookie(res, signAccessToken(user.id));
    setRefreshCookie(res, signRefreshToken(user.id));
    res.json(serializeUser(user));
  }),
);

authRouter.post(
  '/auth/refresh/',
  asyncHandler(async (req, res) => {
    const userId = verifyRefreshToken(req.cookies?.[REFRESH_COOKIE]);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw unauthorized('Token is invalid or expired');

    setAccessCookie(res, signAccessToken(user.id));
    res.status(204).end();
  }),
);

// Public on purpose: the access token may already be expired when logging out.
authRouter.post('/auth/logout/', (_req, res) => {
  clearAuthCookies(res);
  res.status(204).end();
});

authRouter.get(
  '/users/me/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new ApiError(404, 'User not found.');
    res.json(serializeUser(user));
  }),
);
