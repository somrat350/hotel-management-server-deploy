import { NextFunction, Request, Response } from "express";
import statusCode from "http-status";
import AppError from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const authorize = (requiredPermissions: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userWrapper = req.user;

    if (!userWrapper) {
      throw new AppError(statusCode.UNAUTHORIZED, "Unauthorized access!");
    }
    const userPermissions = req.user.permissions || [];

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
    if (!hasPermission) {
      throw new AppError(statusCode.FORBIDDEN, "Forbidden access!");
    }

    next();
  });
};
