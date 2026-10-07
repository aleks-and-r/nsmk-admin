import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ApiError, unauthorized } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import {
  requireAuth,
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

    res.json({
      access: signAccessToken(user.id),
      refresh: signRefreshToken(user.id),
    });
  }),
);

authRouter.post(
  '/auth/refresh/',
  asyncHandler(async (req, res) => {
    const { refresh } = z.object({ refresh: z.string().min(1) }).parse(req.body);
    const userId = verifyRefreshToken(refresh);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw unauthorized('Token is invalid or expired');

    res.json({ access: signAccessToken(user.id) });
  }),
);

authRouter.get(
  '/users/me/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new ApiError(404, 'User not found.');
    res.json(serializeUser(user));
  }),
);
