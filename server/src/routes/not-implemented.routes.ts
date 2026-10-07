import { Router } from 'express';

export const notImplementedRouter = Router();

// Import/export and computed league endpoints are deferred to a later pass.
// They are registered so the UI's buttons report a clear message instead of
// failing as an unexplained 404.
const PATHS = [
  '/:resource/import/',
  '/:resource/export/',
  '/games/:id/import-stats/',
  '/leagues/:id/standings/',
  '/leagues/:id/leaders/',
  '/leagues/:id/results/',
  '/leagues/:id/schedule/',
  '/leagues/:id/team-stats/',
  '/leagues/:id/refresh-summaries/',
];

notImplementedRouter.all(PATHS, (_req, res) => {
  res.status(501).json({ detail: 'Not implemented yet.' });
});
