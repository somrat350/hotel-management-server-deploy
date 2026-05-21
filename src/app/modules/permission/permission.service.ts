import statusCode from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { SystemLevel } from "@prisma/client";
import { ROLE_PERMISSION_MAP } from "../../constants/rolePermissions";

const getPermissions = async (level: SystemLevel) => {
  const permissionNames =
    ROLE_PERMISSION_MAP[level as keyof typeof ROLE_PERMISSION_MAP];
  if (!permissionNames) return [];

  return prisma.permission.findMany({
    where: {
      name: { in: permissionNames },
    },
  });
};

const disablePermission = async (
  userId: string,
  roleId: string,
  permissionId: string,
) => {
  const exists = await prisma.disabledPermission.findUnique({
    where: {
      userId_roleId_permissionId: { userId, roleId, permissionId },
    },
  });

  if (exists) {
    throw new AppError(statusCode.BAD_REQUEST, "Permission already disabled!");
  }
  const rolePermission = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });
  if (!rolePermission) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "Role does not have this permission",
    );
  }
  const disabled = await prisma.disabledPermission.create({
    data: { userId, roleId, permissionId },
  });
  return disabled;
};

const removeDisabled = async (disabledPermissionId: string) => {
  const removed = await prisma.disabledPermission.delete({
    where: { id: disabledPermissionId },
  });
  return removed;
};

const disabledByUser = async (userId: string) => {
  const permissions = await prisma.disabledPermission.findMany({
    where: { userId },
    select: {
      id: true,
      roleId: true,
      permission: { select: { id: true, name: true } },
    },
  });
  return permissions;
};

const PermissionService = {
  getPermissions,
  disablePermission,
  removeDisabled,
  disabledByUser,
};

export default PermissionService;
