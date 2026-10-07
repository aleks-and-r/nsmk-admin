import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeTeam } from '../serializers/index.js';
import { zBool, zInt, zNullableInt } from '../lib/zod.js';

export const teamsRouter = Router();

const INCLUDE = {
  club: true,
  season: true,
  memberships: { where: { isActive: true }, include: { player: true } },
} as const;

const bodySchema = z.object({
  club: zInt,
  name: z.string().min(1),
  season: zNullableInt.optional(),
  age_group_label: z.string().optional(),
  is_active: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.club !== undefined && { clubId: body.club }),
    ...(body.name !== undefined && { name: body.name }),
    ...(body.season !== undefined && { seasonId: body.season }),
    ...(body.age_group_label !== undefined && { ageGroupLabel: body.age_group_label }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
  };
}

teamsRouter.get(
  '/teams/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.team, {
      where: buildSearch(req.query.search, ['name', 'club.name', 'ageGroupLabel']),
      include: INCLUDE,
      orderBy: { name: 'asc' },
      serialize: serializeTeam,
    });
  }),
);

teamsRouter.get(
  '/teams/:id/',
  asyncHandler(async (req, res) => {
    const team = await prisma.team.findUnique({
      where: { id: idParam(req) },
      include: INCLUDE,
    });
    if (!team) throw notFound('Team not found.');
    res.json(serializeTeam(team));
  }),
);

teamsRouter.post(
  '/teams/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const team = await prisma.team.create({
      data: { ...toData(body), name: body.name, clubId: body.club },
      include: INCLUDE,
    });
    res.status(201).json(serializeTeam(team));
  }),
);

teamsRouter.patch(
  '/teams/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const team = await prisma.team.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeTeam(team));
  }),
);
