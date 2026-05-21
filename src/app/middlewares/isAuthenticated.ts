import jwt from "jsonwebtoken";
import statusCode from "http-status";
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { JwtPayload } from "../types/index";
import ENV from "../config/env";

export const isAuthenticated = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const cookieToken = req.cookies.accessToken;
    const token = headerToken || cookieToken;

    if (!token) {
      throw new AppError(
        statusCode.UNAUTHORIZED,
        "Unauthorized - No token provided!",
      );
    }

    const decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET) as JwtPayload;
    if (!decoded) {
      throw new AppError(
        statusCode.UNAUTHORIZED,
        "Unauthorized - Invalid token!",
      );
    }

    req.user = decoded;
    next();
  },
);
