import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { uploadImage, uploadedPath } from '../middleware/upload.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializePlayer } from '../serializers/index.js';
import { zBool, zNullableDate, zNullableInt } from '../lib/zod.js';

export const playersRouter = Router();

const SEARCH_FIELDS = ['firstName', 'lastName', 'club.name'];

const INCLUDE = {
  club: true,
  teamMemberships: { include: { team: { include: { club: true } } } },
} as const;

const bodySchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_year: zNullableInt.optional(),
  birth_date: zNullableDate.optional(),
  position: z.string().optional(),
  club: zNullableInt.optional(),
  is_active: zBool.optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>, file?: Express.Multer.File) {
  const photo = uploadedPath(file);
  return {
    ...(body.first_name !== undefined && { firstName: body.first_name }),
    ...(body.last_name !== undefined && { lastName: body.last_name }),
    ...(body.birth_year !== undefined && { birthYear: body.birth_year }),
    ...(body.birth_date !== undefined && { birthDate: body.birth_date }),
    ...(body.position !== undefined && { position: body.position }),
    ...(body.club !== undefined && { clubId: body.club }),
    ...(body.is_active !== undefined && { isActive: body.is_active }),
    ...(photo && { photo }),
  };
}

playersRouter.get(
  '/players/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.player, {
      where: buildSearch(req.query.search, SEARCH_FIELDS),
      include: INCLUDE,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      serialize: serializePlayer,
    });
  }),
);

playersRouter.get(
  '/players/:id/',
  asyncHandler(async (req, res) => {
    const player = await prisma.player.findUnique({
      where: { id: idParam(req) },
      include: INCLUDE,
    });
    if (!player) throw notFound('Player not found.');
    res.json(serializePlayer(player));
  }),
);

playersRouter.post(
  '/players/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const player = await prisma.player.create({
      data: {
        ...toData(body, req.file),
        firstName: body.first_name,
        lastName: body.last_name,
      },
      include: INCLUDE,
    });
    res.status(201).json(serializePlayer(player));
  }),
);

playersRouter.patch(
  '/players/:id/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const player = await prisma.player.update({
      where: { id: idParam(req) },
      data: toData(body, req.file),
      include: INCLUDE,
    });
    res.json(serializePlayer(player));
  }),
);
