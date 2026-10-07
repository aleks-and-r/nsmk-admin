import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeLeague } from '../serializers/index.js';
import { zBool, zInt, zNullableInt } from '../lib/zod.js';

export const leaguesRouter = Router();

const INCLUDE = {
  season: true,
  memberships: { include: { team: true } },
} as const;

const bodySchema = z.object({
  season: zInt,
  name: z.string().min(1),
  age_group: z.string().optional(),
  reference_birth_year: zNullableInt.optional(),
  points_for_win: zInt.optional(),
  points_for_loss: zInt.optional(),
  points_for_forfeit: zInt.optional(),
  is_active: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.season !== undefined && { seasonId: body.season }),
    ...(body.name !== undefined && { name: body.name }),
    ...(body.age_group !== undefined && { ageGroup: body.age_group }),
    ...(body.reference_birth_year !== undefined && {
      referenceBirthYear: body.reference_birth_year,
    }),
    ...(body.points_for_win !== undefined && { pointsForWin: body.points_for_win }),
    ...(body.points_for_loss !== undefined && { pointsForLoss: body.points_for_loss }),
    ...(body.points_for_forfeit !== undefined && {
      pointsForForfeit: body.points_for_forfeit,
    }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
  };
}

leaguesRouter.get(
  '/leagues/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.league, {
      where: buildSearch(req.query.search, ['name', 'ageGroup', 'season.name']),
      include: INCLUDE,
      orderBy: { id: 'desc' },
      serialize: serializeLeague,
    });
  }),
);

leaguesRouter.get(
  '/leagues/:id/',
  asyncHandler(async (req, res) => {
    const league = await prisma.league.findUnique({
      where: { id: idParam(req) },
      include: INCLUDE,
    });
    if (!league) throw notFound('League not found.');
    res.json(serializeLeague(league));
  }),
);

leaguesRouter.post(
  '/leagues/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const league = await prisma.league.create({
      data: { ...toData(body), name: body.name, seasonId: body.season },
      include: INCLUDE,
    });
    res.status(201).json(serializeLeague(league));
  }),
);

leaguesRouter.patch(
  '/leagues/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const league = await prisma.league.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeLeague(league));
  }),
);

leaguesRouter.delete(
  '/leagues/:id/',
  asyncHandler(async (req, res) => {
    await prisma.league.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
