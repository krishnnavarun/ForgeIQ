import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

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

    next();
  };
}