import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type ValidateSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

type RequestField = "body" | "params" | "query";

/** Express 5 exposes `req.query` (and sometimes `req.params`) as read-only. */
function setRequestField(
  req: Parameters<RequestHandler>[0],
  key: RequestField,
  value: unknown,
): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export const validate =
  (schemas: ValidateSchemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) {
        setRequestField(req, "body", schemas.body.parse(req.body));
      }
      if (schemas.params) {
        setRequestField(
          req,
          "params",
          schemas.params.parse(req.params),
        );
      }
      if (schemas.query) {
        setRequestField(
          req,
          "query",
          schemas.query.parse(req.query),
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
