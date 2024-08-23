import type { Request, Response, NextFunction } from "express";

export const routeLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(
    `${req.method} ${req.url} ${req.query || ""} ${req.params || ""}`,
  );
  next();
};
