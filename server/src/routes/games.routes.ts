import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { buildSearch, idParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { notFound } from '../lib/errors.js';
import { serializeGame } from '../serializers/index.js';
import { zInt, zNullableDate, zNullableInt } from '../lib/zod.js';

export const gamesRouter = Router();

const INCLUDE = {
  league: true,
  round: true,
  homeTeam: true,
  awayTeam: true,
  venue: true,
} as const;

const statusEnum = z.enum([
  'scheduled',
  'in_progress',
  'finished',
  'cancelled',
  'postponed',
]);

const bodySchema = z.object({
  league: zInt,
  round: zNullableInt.optional(),
  playoff_bracket: zNullableInt.optional(),
  home_team: zInt,
  away_team: zInt,
  venue: zNullableInt.optional(),
  scheduled_at: zNullableDate.optional(),
  court_name: z.string().optional(),
  status: statusEnum.optional(),
  notes: z.string().optional(),
});

type Body = z.infer<typeof bodySchema>;

function toData(body: Partial<Body>) {
  return {
    ...(body.league !== undefined && { leagueId: body.league }),
    ...(body.round !== undefined && { roundId: body.round }),
    ...(body.playoff_bracket !== undefined && { playoffBracket: body.playoff_bracket }),
    ...(body.home_team !== undefined && { homeTeamId: body.home_team }),
    ...(body.away_team !== undefined && { awayTeamId: body.away_team }),
    ...(body.venue !== undefined && { venueId: body.venue }),
    ...(body.scheduled_at !== undefined && { scheduledAt: body.scheduled_at }),
    ...(body.court_name !== undefined && { courtName: body.court_name }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.notes !== undefined && { notes: body.notes }),
  };
}

const scoreSchema = z.object({
  home_q1: zNullableInt.optional(),
  home_q2: zNullableInt.optional(),
  home_q3: zNullableInt.optional(),
  home_q4: zNullableInt.optional(),
  away_q1: zNullableInt.optional(),
  away_q2: zNullableInt.optional(),
  away_q3: zNullableInt.optional(),
  away_q4: zNullableInt.optional(),
  status: statusEnum.optional(),
});

const sumQuarters = (quarters: (number | null)[]): number | null =>
  quarters.every((q) => q == null)
    ? null
    : quarters.reduce<number>((total, q) => total + (q ?? 0), 0);

gamesRouter.get(
  '/games/',
  asyncHandler(async (req, res) => {
    await listResponse(req, res, prisma.game, {
      where: buildSearch(req.query.search, [
        'homeTeam.name',
        'awayTeam.name',
        'league.name',
      ]),
      include: INCLUDE,
      orderBy: [{ scheduledAt: 'desc' }, { id: 'desc' }],
      serialize: serializeGame,
    });
  }),
);

gamesRouter.get(
  '/games/:id/',
  asyncHandler(async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { id: idParam(req) },
      include: INCLUDE,
    });
    if (!game) throw notFound('Game not found.');
    res.json(serializeGame(game));
  }),
);

gamesRouter.post(
  '/games/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const game = await prisma.game.create({
      data: {
        ...toData(body),
        leagueId: body.league,
        homeTeamId: body.home_team,
        awayTeamId: body.away_team,
      },
      include: INCLUDE,
    });
    res.status(201).json(serializeGame(game));
  }),
);

gamesRouter.patch(
  '/games/:id/score/',
  asyncHandler(async (req, res) => {
    const body = scoreSchema.parse(req.body);
    const id = idParam(req);

    const current = await prisma.game.findUnique({ where: { id } });
    if (!current) throw notFound('Game not found.');

    const pick = (key: keyof typeof body, fallback: number | null) =>
      body[key] !== undefined ? (body[key] as number | null) : fallback;

    const home = [
      pick('home_q1', current.homeQ1),
      pick('home_q2', current.homeQ2),
      pick('home_q3', current.homeQ3),
      pick('home_q4', current.homeQ4),
    ];
    const away = [
      pick('away_q1', current.awayQ1),
      pick('away_q2', current.awayQ2),
      pick('away_q3', current.awayQ3),
      pick('away_q4', current.awayQ4),
    ];

    const game = await prisma.game.update({
      where: { id },
      data: {
        homeQ1: home[0],
        homeQ2: home[1],
        homeQ3: home[2],
        homeQ4: home[3],
        awayQ1: away[0],
        awayQ2: away[1],
        awayQ3: away[2],
        awayQ4: away[3],
        homeScore: sumQuarters(home),
        awayScore: sumQuarters(away),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: INCLUDE,
    });

    res.json(serializeGame(game));
  }),
);

gamesRouter.patch(
  '/games/:id/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.partial().parse(req.body);
    const game = await prisma.game.update({
      where: { id: idParam(req) },
      data: toData(body),
      include: INCLUDE,
    });
    res.json(serializeGame(game));
  }),
);

gamesRouter.delete(
  '/games/:id/',
  asyncHandler(async (req, res) => {
    await prisma.game.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
