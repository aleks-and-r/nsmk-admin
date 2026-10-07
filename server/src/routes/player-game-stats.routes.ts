import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { idParam, intParam } from '../lib/query.js';
import { listResponse } from '../lib/list.js';
import { serializePlayerGameStat } from '../serializers/index.js';
import { zInt } from '../lib/zod.js';

export const playerGameStatsRouter = Router();

const INCLUDE = { player: true, team: true } as const;

const bodySchema = z.object({
  game: zInt,
  player: zInt,
  team: zInt,
  ft_made: zInt.optional(),
  two_pt_made: zInt.optional(),
  three_pt_made: zInt.optional(),
  fouls: zInt.optional(),
});

playerGameStatsRouter.get(
  '/player-game-stats/',
  asyncHandler(async (req, res) => {
    const game = intParam(req.query.game);

    await listResponse(req, res, prisma.playerGameStat, {
      where: game !== undefined ? { gameId: game } : undefined,
      include: INCLUDE,
      orderBy: { id: 'asc' },
      serialize: serializePlayerGameStat,
    });
  }),
);

playerGameStatsRouter.post(
  '/player-game-stats/',
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse(req.body);
    const stat = await prisma.playerGameStat.create({
      data: {
        gameId: body.game,
        playerId: body.player,
        teamId: body.team,
        ftMade: body.ft_made ?? 0,
        twoPtMade: body.two_pt_made ?? 0,
        threePtMade: body.three_pt_made ?? 0,
        fouls: body.fouls ?? 0,
      },
      include: INCLUDE,
    });
    res.status(201).json(serializePlayerGameStat(stat));
  }),
);

playerGameStatsRouter.delete(
  '/player-game-stats/:id/',
  asyncHandler(async (req, res) => {
    await prisma.playerGameStat.delete({ where: { id: idParam(req) } });
    res.status(204).send();
  }),
);
