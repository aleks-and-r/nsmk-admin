import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { uploadImage, uploadedPath } from '../middleware/upload.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeClub } from '../serializers/index.js';
import { zNullableString } from '../lib/zod.js';

export const clubsRouter = Router();

const SEARCH_FIELDS = ['name', 'shortName', 'owner'];

const bodySchema = z.object({
  name: z.string().min(1),
  short_name: z.string().optional(),
  owner: z.string().optional(),
  contact_email: zNullableString.optional(),
  contact_phone: zNullableString.optional(),
  website: z.string().optional(),
  facebook_url: z.string().optional(),
  twitter_url: z.string().optional(),
  instagram_url: z.string().optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>, file?: Express.Multer.File) {
  const logo = uploadedPath(file);
  return {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.short_name !== undefined && { shortName: body.short_name }),
    ...(body.owner !== undefined && { owner: body.owner }),
    ...(body.contact_email !== undefined && { contactEmail: body.contact_email }),
    ...(body.contact_phone !== undefined && { contactPhone: body.contact_phone }),
    ...(body.website !== undefined && { website: body.website }),
    ...(body.facebook_url !== undefined && { facebookUrl: body.facebook_url }),
    ...(body.twitter_url !== undefined && { twitterUrl: body.twitter_url }),
    ...(body.instagram_url !== undefined && { instagramUrl: body.instagram_url }),
    ...(logo && { logo }),
  };
}

clubsRouter.get(
  '/clubs/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.club, {
      where: buildSearch(req.query.search, SEARCH_FIELDS),
      orderBy: { name: 'asc' },
      serialize: serializeClub,
    });
  }),
);

clubsRouter.get(
  '/clubs/:id/',
  asyncHandler(async (req, res) => {
    const club = await prisma.club.findUnique({ where: { id: idParam(req) } });
    if (!club) throw notFound('Club not found.');
    res.json(serializeClub(club));
  }),
);

clubsRouter.post(
  '/clubs/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const club = await prisma.club.create({
      data: { ...toData(body, req.file), name: body.name },
    });
    res.status(201).json(serializeClub(club));
  }),
);

clubsRouter.patch(
  '/clubs/:id/',
  uploadImage,
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const club = await prisma.club.update({
      where: { id: idParam(req) },
      data: toData(body, req.file),
    });
    res.json(serializeClub(club));
  }),
);
