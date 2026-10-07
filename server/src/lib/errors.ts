export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new ApiError(404, what);
export const unauthorized = (msg = 'Authentication credentials were not provided.') =>
  new ApiError(401, msg);
