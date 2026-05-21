import statusCode from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";

export const findRole = async (id: string) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError(statusCode.NOT_FOUND, "Role not found!");
  }
  return role;
};
