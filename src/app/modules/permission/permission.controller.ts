import type { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import PermissionService from "./permission.service";
import ApiResponse from "../../utils/ApiResponse";

const getPermissions = catchAsync(async (req: Request, res: Response) => {
  const { systemLevel } = req.user;
  const result = await PermissionService.getPermissions(systemLevel);
  ApiResponse.success(res, result, "Permission fetched success.");
});

const disablePermission = catchAsync(async (req: Request, res: Response) => {
  const { userId, roleId, permissionId } = req.body;
  const result = await PermissionService.disablePermission(
    userId,
    roleId,
    permissionId,
  );
  ApiResponse.success(res, result, "Permission disabled.", statusCode.CREATED);
});

const removeDisabled = catchAsync(async (req: Request, res: Response) => {
  const { disabledId } = req.params;
  await PermissionService.removeDisabled(disabledId as string);
  ApiResponse.success(res, { disabledId }, "Permission removed from disabled.");
});

const disabledByUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await PermissionService.disabledByUser(userId as string);
  ApiResponse.success(
    res,
    result,
    "Get all disabled permission for this user.",
  );
});

const PermissionController = {
  getPermissions,
  disablePermission,
  removeDisabled,
  disabledByUser,
};

export default PermissionController;
