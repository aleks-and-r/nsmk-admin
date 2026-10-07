import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeVenue } from '../serializers/index.js';
import { zBool, zInt } from '../lib/zod.js';

export const venuesRouter = Router();

const bodySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  court_count: zInt.optional(),
  is_active: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.address !== undefined && { address: body.address }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.court_count !== undefined && { courtCount: body.court_count }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
  };
}

venuesRouter.get(
  '/venues/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.venue, {
      where: buildSearch(req.query.search, ['name', 'city', 'address']),
      orderBy: { name: 'asc' },
      serialize: serializeVenue,
    });
  }),
);

venuesRouter.get(
  '/venues/:id/',
  asyncHandler(async (req, res) => {
    const venue = await prisma.venue.findUnique({ where: { id: idParam(req) } });
    if (!venue) throw notFound('Venue not found.');
    res.json(serializeVenue(venue));
  }),
);

venuesRouter.post(
  '/venues/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const venue = await prisma.venue.create({
      data: { ...toData(body), name: body.name },
    });
    res.status(201).json(serializeVenue(venue));
  }),
);

// The frontend uses PUT (not PATCH) for venue updates.
venuesRouter.put(
  '/venues/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const venue = await prisma.venue.update({
      where: { id: idParam(req) },
      data: toData(body),
    });
    res.json(serializeVenue(venue));
  }),
);

venuesRouter.delete(
  '/venues/:id/',
  asyncHandler(async (req, res) => {
    await prisma.venue.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
