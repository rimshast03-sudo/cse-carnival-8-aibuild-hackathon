import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { AppError } from "../utils/AppError";

type Location = "body" | "params" | "query";

/**
 * Validates `req[location]` against a Zod schema before the route handler
 * runs. On success, `req[location]` is replaced with the parsed (and
 * type-coerced, e.g. string->number) value. On failure, forwards a 400
 * AppError with the flattened Zod issues as `details`.
 */
export function validate(schema: ZodTypeAny, location: Location = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[location]);
      (req as any)[location] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError("Validation failed", 400, err.flatten()));
      } else {
        next(err);
      }
    }
  };
}
