/**
 * A known, expected error (bad input, not found, conflict, etc).
 * Thrown from controllers and caught by the centralized error handler,
 * which uses `statusCode` to shape the HTTP response.
 */
export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
