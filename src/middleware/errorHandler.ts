import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
};
