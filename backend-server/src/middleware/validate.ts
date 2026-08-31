import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

/**
 * Express 5's `req.query` (and, defensively, `req.params`) can be backed by a
 * getter that recomputes from the raw URL rather than a plain mutable object,
 * so writing coerced/defaulted values back onto them (e.g. via Object.assign)
 * silently does not persist to later middleware. Validated — and therefore
 * type-coerced and defaulted — data is instead stashed here; read it via
 * `request.validated.query` / `.params` instead of the raw Express fields
 * whenever a schema applies transforms, coercion, or defaults.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    const results = {
      body: schemas.body?.safeParse(request.body),
      params: schemas.params?.safeParse(request.params),
      query: schemas.query?.safeParse(request.query),
    };

    const failure = Object.values(results).find((result) => result && !result.success);
    if (failure && !failure.success) {
      next(failure.error);
      return;
    }

    if (results.body?.success) request.body = results.body.data;
    request.validated ??= {};
    if (results.params?.success) request.validated.params = results.params.data as Record<string, unknown>;
    if (results.query?.success) request.validated.query = results.query.data as Record<string, unknown>;

    next();
  };
}