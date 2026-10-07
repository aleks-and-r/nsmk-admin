import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { idParam, intParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { serializeLeagueMembership } from '../serializers/index.js';
import { zBool, zInt } from '../lib/zod.js';

export const leagueMembershipsRouter = Router();

const INCLUDE = { league: true, team: true } as const;

const bodySchema = z.object({
  league: zInt,
  team: zInt,
  in_competition: zBool.optional(),
  is_withdrawn: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.league !== undefined && { leagueId: body.league }),
    ...(body.team !== undefined && { teamId: body.team }),
    ...(body.in_competition !== undefined && { inCompetition: body.in_competition }),
    ...(body.is_withdrawn !== undefined && { isWithdrawn: body.is_withdrawn }),
  };
}

leagueMembershipsRouter.get(
  '/league-memberships/',
  asyncHandler(async (req, res) => {
    const league = intParam(req.query.league);
    const team = intParam(req.query.team);

    await listResponse(req, res, prisma.leagueMembership, {
      where: {
        ...(league !== undefined && { leagueId: league }),
        ...(team !== undefined && { teamId: team }),
      },
      include: INCLUDE,
      orderBy: { id: 'asc' },
      serialize: serializeLeagueMembership,
    });
  }),
);

leagueMembershipsRouter.post(
  '/league-memberships/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const membership = await prisma.leagueMembership.create({
      data: { ...toData(body), leagueId: body.league, teamId: body.team },
      include: INCLUDE,
    });
    res.status(201).json(serializeLeagueMembership(membership));
  }),
);

leagueMembershipsRouter.patch(
  '/league-memberships/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const membership = await prisma.leagueMembership.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeLeagueMembership(membership));
  }),
);

leagueMembershipsRouter.delete(
  '/league-memberships/:id/',
  asyncHandler(async (req, res) => {
    await prisma.leagueMembership.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
