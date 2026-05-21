import type { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import RoleService from "./role.service";
import { SystemLevel } from "@prisma/client";
import ApiResponse from "../../utils/ApiResponse";

const createRole = catchAsync(async (req: Request, res: Response) => {
  const { name, permissions } = req.body;
  const { userId: creatorId } = req.user;
  const result = await RoleService.create({ name, creatorId, permissions });
  ApiResponse.success(
    res,
    result,
    "Role created successfully.",
    statusCode.CREATED,
  );
});

const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await RoleService.getAllRoles(userId);
  ApiResponse.success(res, result, "Roles get successfully.");
});

const getSingleRole = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.getSingleRole(req.params.roleId as string);
  ApiResponse.success(res, result, "Role get successfully.");
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
  const { userId: creatorId } = req.user;
  const result = await RoleService.updateRole(
    creatorId,
    req.params.roleId as string,
    req.body,
  );
  ApiResponse.success(res, result, "Role updated successfully");
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const { userId: creatorId } = req.user;
  await RoleService.deleteRole(req.params.roleId as string, creatorId);
  ApiResponse.success(res, req.params.roleId, "Role deleted successfully.");
});

const assignRole = (level: SystemLevel) => {
  return catchAsync(async (req: Request, res: Response) => {
    const result = await RoleService.assignRole(
      level,
      req.params.roleId as string,
      req.body.rowId,
    );
    ApiResponse.success(res, result, "Role assigned successfully.");
  });
};

const RoleController = {
  createRole,
  getAllRoles,
  getSingleRole,
  updateRole,
  deleteRole,
  assignRole,
};

export default RoleController;
