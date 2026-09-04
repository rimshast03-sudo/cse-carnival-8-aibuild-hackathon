import { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `No route found for ${req.method} ${req.originalUrl}`,
    },
  });
}
