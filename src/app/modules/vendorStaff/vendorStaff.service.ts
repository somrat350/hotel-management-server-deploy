import statusCode from "http-status";
import { prisma } from "../../lib/prisma";
import { CreateVendorStaffInput } from "./vendorStaff.validation";
import AppError from "../../utils/AppError";
import AuthHelper from "../auth/auth.helper";
import { calculatePagination } from "../../utils/pagination";
import { IPaginationOptions } from "../../types";
import { buildSearchCondition } from "../../utils/search";
import { Prisma } from "@prisma/client";

const createVendorStaff = async (
  ownerId: string,
  staffData: CreateVendorStaffInput,
) => {
  const { name, email, password, phone, roleId } = staffData;

  // hash promise
  const passwordHashPromise = AuthHelper.passwordHash(password);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check existing
    const [vendor, role, user, hashedPassword] = await Promise.all([
      tx.vendor.findUnique({
        where: { userId: ownerId },
        select: { id: true },
      }),
      tx.role.findUnique({ where: { id: roleId }, select: { id: true } }),
      tx.user.findUnique({ where: { email }, select: { id: true } }),
      passwordHashPromise,
    ]);
    if (!vendor) throw new AppError(statusCode.NOT_FOUND, "Vendor not found!");
    if (!role) throw new AppError(statusCode.NOT_FOUND, "Role not found!");
    if (user) throw new AppError(statusCode.CONFLICT, "User already exist!");

    // Create user
    const createdUser = await tx.user.create({
      data: { name, email, phone, password: hashedPassword, isVerified: true },
      select: { id: true },
    });
    const vendorStaff = await tx.vendorStaff.create({
      data: { userId: createdUser.id, roleId: role.id, ownerId: vendor.id },
      select: {
        role: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    return vendorStaff;
  });
};

const myVendorStaff = async (
  ownerUserId: string,
  queryPayload: IPaginationOptions,
) => {
  const vendorSearchableFields = ["name", "email", "phone"];
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(queryPayload);
  const searchCondition = buildSearchCondition(
    queryPayload.searchTerm || "",
    vendorSearchableFields,
  );

  const { total, staffs } = await prisma.$transaction(async (tx) => {
    const owner = await tx.vendor.findUnique({
      where: { userId: ownerUserId },
      select: { id: true },
    });
    if (!owner) throw new AppError(statusCode.NOT_FOUND, "Vendor not found!");
    // main where condition
    const whereCondition: Prisma.VendorStaffWhereInput = {
      ownerId: owner.id,
      ...searchCondition,
    };

    const [total, staffs] = await Promise.all([
      tx.vendorStaff.count({
        where: whereCondition,
      }),
      tx.vendorStaff.findMany({
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
      }),
    ]);
    return { total, staffs };
  });

  // meta response
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: staffs,
  };
};

const singleStaff = async (staffId: string) => {
  const staff = await prisma.vendorStaff.findUnique({
    where: { id: staffId },
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

  return staff;
};

const deleteVendorStaff = async (staffId: string) => {
  return prisma.$transaction(async (tx) => {
    // Step 1: ownership check
    const staff = await tx.vendorStaff.findUnique({
      where: { id: staffId },
    });
    if (!staff) throw new AppError(statusCode.NOT_FOUND, "Staff not found!");

    // Step 2: delete
    await tx.vendorStaff.delete({
      where: { id: staffId },
    });

    return null;
  });
};

const VendorStaffService = {
  createVendorStaff,
  myVendorStaff,
  singleStaff,
  deleteVendorStaff,
};
export default VendorStaffService;
