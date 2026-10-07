import type { Request, Response } from 'express';
import { paginated, parsePagination } from './paginate.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Delegate {
  findMany(args: any): Promise<any[]>;
  count(args: any): Promise<number>;
}

interface ListOptions<T> {
  where?: any;
  include?: any;
  orderBy?: any;
  serialize: (row: any) => T;
}

/** Builds the DRF `{count,next,previous,results}` envelope every list endpoint returns. */
export async function listResponse<T>(
  req: Request,
  res: Response,
  delegate: Delegate,
  { where, include, orderBy, serialize }: ListOptions<T>,
): Promise<void> {
  const params = parsePagination(req.query);

  const [count, rows] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({
      where,
      include,
      orderBy: orderBy ?? { id: 'asc' },
      skip: params.skip,
      take: params.take,
    }),
  ]);

  res.json(paginated(req, params, count, rows.map(serialize)));
}
