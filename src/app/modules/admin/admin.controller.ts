import { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import AdminService from "./admin.service";
import ApiResponse from "../../utils/ApiResponse";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const admin = await AdminService.createAdmin(req.body);
  ApiResponse.success(
    res,
    admin,
    "Admin created successful.",
    statusCode.CREATED,
  );
});

const myAdmins = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await AdminService.myAdmins(req.query);
  ApiResponse.paginated(res, data, meta, "Admin get successful.");
});

const singleAdmin = catchAsync(async (req: Request, res: Response) => {
  const admin = await AdminService.singleAdmin(req.params.adminId as string);
  ApiResponse.success(res, admin, "Admin get successfully.");
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.params.adminId as string;
  await AdminService.deleteAdmin(adminId);
  ApiResponse.success(res, { adminId }, "Admin deleted successfully.");
});

const AdminController = {
  createAdmin,
  myAdmins,
  singleAdmin,
  deleteAdmin,
};

export default AdminController;
