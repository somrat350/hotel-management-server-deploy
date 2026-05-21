import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error.issues[0]?.message || "Invalid request data",
        });
      }
      req.body = result.data;
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.issues[0]?.message || "Invalid zod request data",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };
};
