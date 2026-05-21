import { Request } from "express";
import AppError from "./AppError";

export const validateImageFile = (req: Request, maxSize: number = 2) => {
  const file = req.file;

  if (!file) {
    return;
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(400, "Only JPG, PNG, WEBP allowed");
  }

  if (file.size > maxSize * 1024 * 1024) {
    throw new AppError(400, `File too large (max ${maxSize}MB)`);
  }

  return file;
};
