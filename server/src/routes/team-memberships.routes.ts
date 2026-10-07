import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { boolParam, idParam, intParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { serializeTeamMembership } from '../serializers/index.js';
import { zBool, zInt, zNullableDate, zNullableInt } from '../lib/zod.js';

export const teamMembershipsRouter = Router();

const INCLUDE = { player: true, team: true } as const;

const bodySchema = z.object({
  player: zInt,
  team: zInt,
  number: zNullableInt.optional(),
  loan: zBool.optional(),
  is_active: zBool.optional(),
  joined_at: zNullableDate.optional(),
  left_at: zNullableDate.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.player !== undefined && { playerId: body.player }),
    ...(body.team !== undefined && { teamId: body.team }),
    ...(body.number !== undefined && { number: body.number }),
    ...(body.loan !== undefined && { loan: body.loan }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
    ...(body.joined_at !== undefined && { joinedAt: body.joined_at }),
    ...(body.left_at !== undefined && { leftAt: body.left_at }),
  };
}

teamMembershipsRouter.get(
  '/team-memberships/',
  asyncHandler(async (req, res) => {
    const player = intParam(req.query.player);
    const team = intParam(req.query.team);
    const includeInactive = boolParam(req.query.include_inactive) ?? false;

    await listResponse(req, res, prisma.teamMembership, {
      where: {
        ...(player !== undefined && { playerId: player }),
        ...(team !== undefined && { teamId: team }),
        // Inactive rows are hidden unless explicitly asked for, so the
        // reactivation flow can find them with ?include_inactive=true.
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: INCLUDE,
      orderBy: { id: 'asc' },
      serialize: serializeTeamMembership,
    });
  }),
);

// Must be registered before "/:id/" or "bulk" is captured as an id.
teamMembershipsRouter.patch(
  '/team-memberships/bulk/',
  asyncHandler(async (req, res) => {
    const items = z
      .array(bodySchema.partial().extend({ id: zInt }))
      .parse(req.body);

    const updated = await prisma.$transaction(
      items.map(({ id, ...patch }) =>
        prisma.teamMembership.update({
          where: { id },
          data: toData(patch),
          include: INCLUDE,
        }),
      ),
    );

    res.json(updated.map(serializeTeamMembership));
  }),
);

teamMembershipsRouter.post(
  '/team-memberships/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const membership = await prisma.teamMembership.create({
      data: { ...toData(body), playerId: body.player, teamId: body.team },
      include: INCLUDE,
    });
    res.status(201).json(serializeTeamMembership(membership));
  }),
);

teamMembershipsRouter.patch(
  '/team-memberships/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const membership = await prisma.teamMembership.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeTeamMembership(membership));
  }),
);

teamMembershipsRouter.delete(
  '/team-memberships/:id/',
  asyncHandler(async (req, res) => {
    await prisma.teamMembership.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
