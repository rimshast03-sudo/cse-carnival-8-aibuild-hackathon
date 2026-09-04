import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

/**
 * Single place where every error in the app ends up. Route handlers just
 * `throw` (or pass to `next()`) and this shapes a consistent JSON response.
 * Must be registered LAST, after all routes.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Our own operational errors (validation, not found, conflict, etc).
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
  }

  // Prisma-specific errors get translated into sensible HTTP statuses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: { message: "A record with that unique value already exists.", details: err.meta },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        error: { message: "Record not found.", details: err.meta },
      });
    }
  }

  // Anything unexpected: log it fully server-side, but don't leak internals.
  console.error("Unhandled error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: { message: "Internal server error", debug: message } });
}
