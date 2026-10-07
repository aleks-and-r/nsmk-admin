import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { uploadImage } from '../middleware/upload.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeCoach } from '../serializers/index.js';
import { zNullableInt } from '../lib/zod.js';

export const coachesRouter = Router();

const SEARCH_FIELDS = ['firstName', 'lastName', 'middleName', 'email'];

const bodySchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  middle_name: z.string().optional(),
  email: z.string().optional(),
  birth_year: zNullableInt.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.first_name !== undefined && { firstName: body.first_name }),
    ...(body.last_name !== undefined && { lastName: body.last_name }),
    ...(body.middle_name !== undefined && { middleName: body.middle_name }),
    ...(body.email !== undefined && { email: body.email }),
    ...(body.birth_year !== undefined && { birthYear: body.birth_year }),
  };
}

coachesRouter.get(
  '/coaches/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.coach, {
      where: buildSearch(req.query.search, SEARCH_FIELDS),
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      serialize: serializeCoach,
    });
  }),
);

coachesRouter.get(
  '/coaches/:id/',
  asyncHandler(async (req, res) => {
    const coach = await prisma.coach.findUnique({ where: { id: idParam(req) } });
    if (!coach) throw notFound('Coach not found.');
    res.json(serializeCoach(coach));
  }),
);

coachesRouter.post(
  '/coaches/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const coach = await prisma.coach.create({
      data: { ...toData(body), firstName: body.first_name, lastName: body.last_name },
    });
    res.status(201).json(serializeCoach(coach));
  }),
);

coachesRouter.patch(
  '/coaches/:id/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const coach = await prisma.coach.update({
      where: { id: idParam(req) },
      data: toData(body),
    });
    res.json(serializeCoach(coach));
  }),
);
