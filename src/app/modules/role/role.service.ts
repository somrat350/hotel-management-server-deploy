import statusCode from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { CreateRoleInput, UpdateRoleInput } from "./role.validation";
import { SystemLevel } from "@prisma/client";
import { Cache } from "../../lib/cache";

const create = async (payload: CreateRoleInput) => {
  const { name, creatorId, permissions: permissionIds = [] } = payload;
  if (name === SystemLevel.ADMIN || name === SystemLevel.VENDOR) {
    throw new AppError(statusCode.CONFLICT, "Please choose another name!");
  }

  const { id } = await prisma.role.create({
    data: {
      name,
      creatorId,
      rolePermissions: permissionIds.length
        ? {
            createMany: {
              data: permissionIds.map((permissionId) => ({ permissionId })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    select: { id: true },
  });

  await Cache.del(`roles:${creatorId}`);

  return { id, name };
};

const getAllRoles = async (creatorId: string) => {
  const cacheKey = `roles:${creatorId}`;

  const cached = await Cache.get(cacheKey);
  if (cached) return cached;

  const roles = await prisma.role.findMany({
    where: { creatorId },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  if (!roles) return null;

  await Cache.set(cacheKey, roles, 60);

  return roles;
};

const getSingleRole = async (roleId: string) => {
  const cacheKey = `role:${roleId}`;
  const cached = await Cache.get(cacheKey);
  if (cached) return cached;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      rolePermissions: {
        select: {
          permission: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!role) return null;

  const formatted = {
    id: role.id,
    name: role.name,
    permissions: role.rolePermissions.map((rp) => rp.permission),
  };

  await Cache.set(cacheKey, formatted, 60);

  return formatted;
};

const updateRole = async (
  creatorId: string,
  id: string,
  payload: UpdateRoleInput,
) => {
  const { name, permissions } = payload;
  await prisma.$transaction(async (tx) => {
    await tx.role.findUnique({
      where: { id, creatorId },
      select: { id: true },
    });
    if (name) {
      await tx.role.update({
        where: { id, creatorId },
        data: { name },
      });
    }

    if (permissions) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });
      if (permissions.length) {
        await tx.rolePermission.createMany({
          data: permissions.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  await Promise.all([Cache.del(`roles:${creatorId}`), Cache.del(`role:${id}`)]);
  return { id, name };
};

const deleteRole = async (roleId: string, creatorId: string) => {
  await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: { id: roleId, creatorId },
      select: { id: true, name: true },
    });
    if (!role) {
      throw new AppError(statusCode.NOT_FOUND, "Role not found!");
    }
    if (role.name === SystemLevel.ADMIN || role.name === SystemLevel.VENDOR) {
      throw new AppError(
        statusCode.BAD_REQUEST,
        "System roles cannot be deleted!",
      );
    }

    // check role in use (Vendor / Admin)
    const [vendorCount, adminCount] = await Promise.all([
      tx.vendor.count({ where: { roleId } }),
      tx.admin.count({ where: { roleId } }),
    ]);

    if (vendorCount > 0 || adminCount > 0) {
      throw new AppError(
        statusCode.BAD_REQUEST,
        "Role is assigned to users. Remove users from this role first.",
      );
    }

    // delete role
    await tx.role.delete({
      where: { id: roleId },
    });
  });

  await Promise.all([
    Cache.del(`role:${roleId}`),
    Cache.del(`roles:${creatorId}`),
  ]);

  return;
};

const assignRole = async (
  level: SystemLevel,
  roleId: string,
  rowId: string,
) => {
  const selectData = {
    id: true,
    userId: true,
    role: { select: { id: true, name: true } },
    user: { select: { name: true, email: true, phone: true, avatar: true } },
  };

  const result = await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) {
      throw new AppError(statusCode.NOT_FOUND, "Role not found!");
    }

    if (level === SystemLevel.VENDOR) {
      return await tx.vendor.update({
        where: { id: rowId },
        data: { roleId },
        select: selectData,
      });
    }

    if (level === SystemLevel.ADMIN) {
      return await tx.admin.update({
        where: { id: rowId },
        data: { roleId },
        select: selectData,
      });
    }

    throw new AppError(statusCode.BAD_REQUEST, "Invalid system level!");
  });

  return result;
};

const RoleService = {
  create,
  getAllRoles,
  getSingleRole,
  updateRole,
  deleteRole,
  assignRole,
};

export default RoleService;
