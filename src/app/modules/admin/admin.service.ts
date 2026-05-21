import statusCode from "http-status";
import { prisma } from "../../lib/prisma";
import { findRole } from "../role/role.helper";
import AppError from "../../utils/AppError";
import AuthHelper from "../auth/auth.helper";
import { calculatePagination } from "../../utils/pagination";
import { IPaginationOptions } from "../../types";
import { buildSearchCondition } from "../../utils/search";
import { Prisma } from "@prisma/client";
import { CreateAdminInput } from "./admin.validation";

const createAdmin = async (adminData: CreateAdminInput) => {
  const { name, email, password, phone, roleId } = adminData;
  const hashedPasswordPromise = AuthHelper.passwordHash(password);

  const [_, existingUser] = await Promise.all([
    findRole(roleId),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existingUser) {
    const admin = await prisma.admin.findUnique({
      where: { userId: existingUser.id },
    });
    if (admin) {
      throw new AppError(statusCode.CONFLICT, "User already exist!");
    }
  }
  return await prisma.$transaction(async (tx) => {
    let user = existingUser;
    if (!user) {
      user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: await hashedPasswordPromise,
          isVerified: true,
        },
      });
    }
    const admin = await tx.admin.create({
      data: {
        userId: user.id,
        roleId,
      },
      select: {
        role: { select: { id: true, name: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });
    return admin;
  });
};

const myAdmins = async (queryPayload: IPaginationOptions) => {
  const adminSearchableFields = ["name", "email", "phone"];
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(queryPayload);
  const searchCondition = buildSearchCondition(
    queryPayload.searchTerm || "",
    adminSearchableFields,
  );

  // main where condition
  const whereCondition: Prisma.AdminWhereInput = {
    ...searchCondition,
  };

  // total count for meta
  const total = await prisma.admin.count({
    where: whereCondition,
  });

  // main query
  const admins = await prisma.admin.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      userId: true,
      role: { select: { id: true, name: true } },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
        },
      },
    },
  });

  // meta response
  const totalPages = Math.ceil(total / limit);
  const meta = {
    page,
    limit,
    total,
    totalPages,
  };

  return {
    meta,
    data: admins,
  };
};

const singleAdmin = async (adminId: string) => {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      userId: true,
      role: { select: { id: true, name: true } },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
        },
      },
    },
  });
  return admin;
};

const deleteAdmin = async (adminId: string) => {
  // Step 1: ownership check
  const admin = await prisma.admin.findUnique({
    where: {
      id: adminId,
    },
  });
  if (!admin) {
    throw new AppError(statusCode.NOT_FOUND, "Admin not found!");
  }

  // Step 2: delete
  await prisma.admin.delete({
    where: { id: adminId },
  });

  return null;
};

const AdminService = {
  createAdmin,
  myAdmins,
  singleAdmin,
  deleteAdmin,
};
export default AdminService;
