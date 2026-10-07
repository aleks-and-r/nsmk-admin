import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeSeason } from '../serializers/index.js';
import { zBool, zNullableDate } from '../lib/zod.js';

export const seasonsRouter = Router();

const INCLUDE = { leagues: true } as const;

const bodySchema = z.object({
  name: z.string().min(1),
  start_date: zNullableDate.optional(),
  end_date: zNullableDate.optional(),
  is_active: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.start_date !== undefined && { startDate: body.start_date }),
    ...(body.end_date !== undefined && { endDate: body.end_date }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
  };
}

seasonsRouter.get(
  '/seasons/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.season, {
      where: buildSearch(req.query.search, ['name']),
      include: INCLUDE,
      orderBy: { name: 'desc' },
      serialize: serializeSeason,
    });
  }),
);

seasonsRouter.get(
  '/seasons/:id/',
  asyncHandler(async (req, res) => {
    const season = await prisma.season.findUnique({
      where: { id: idParam(req) },
      include: INCLUDE,
    });
    if (!season) throw notFound('Season not found.');
    res.json(serializeSeason(season));
  }),
);

seasonsRouter.post(
  '/seasons/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const season = await prisma.season.create({
      data: { ...toData(body), name: body.name },
      include: INCLUDE,
    });
    res.status(201).json(serializeSeason(season));
  }),
);

seasonsRouter.patch(
  '/seasons/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const season = await prisma.season.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeSeason(season));
  }),
);
