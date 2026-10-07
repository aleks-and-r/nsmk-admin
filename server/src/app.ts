import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { requireAuth, requireCsrfHeader } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import { authRouter } from './routes/auth.routes.js';
import { clubsRouter } from './routes/clubs.routes.js';
import { coachesRouter } from './routes/coaches.routes.js';
import { playersRouter } from './routes/players.routes.js';
import { seasonsRouter } from './routes/seasons.routes.js';
import { leaguesRouter } from './routes/leagues.routes.js';
import { teamsRouter } from './routes/teams.routes.js';
import { venuesRouter } from './routes/venues.routes.js';
import { gamesRouter } from './routes/games.routes.js';
import { teamMembershipsRouter } from './routes/team-memberships.routes.js';
import { leagueMembershipsRouter } from './routes/league-memberships.routes.js';
import { playerGameStatsRouter } from './routes/player-game-stats.routes.js';
import { notImplementedRouter } from './routes/not-implemented.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/media', express.static(UPLOAD_DIR));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const api = express.Router();
  api.use(requireCsrfHeader);
  api.use(authRouter);

  api.use(requireAuth);

  // Registered first: "import"/"export" would otherwise be captured as an :id.
  api.use(notImplementedRouter);

  api.use(clubsRouter);
  api.use(coachesRouter);
  api.use(playersRouter);
  api.use(seasonsRouter);
  api.use(leaguesRouter);
  api.use(teamsRouter);
  api.use(venuesRouter);
  api.use(gamesRouter);
  api.use(teamMembershipsRouter);
  api.use(leagueMembershipsRouter);
  api.use(playerGameStatsRouter);

  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
