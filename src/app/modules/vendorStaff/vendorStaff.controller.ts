import { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import VendorStaffService from "./vendorStaff.service";
import ApiResponse from "../../utils/ApiResponse";

const createVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const staff = await VendorStaffService.createVendorStaff(userId, req.body);
  ApiResponse.success(
    res,
    staff,
    "Vendor staff created successful.",
    statusCode.CREATED,
  );
});

const myVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { data, meta } = await VendorStaffService.myVendorStaff(
    userId,
    req.query,
  );
  ApiResponse.paginated(res, data, meta, "Fetch my staff.");
});

const singleStaff = catchAsync(async (req: Request, res: Response) => {
  const staff = await VendorStaffService.singleStaff(
    req.params.staffId as string,
  );
  ApiResponse.success(res, staff, "Staff fetch successful.");
});

const deleteVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const staffId = req.params.staffId as string;
  await VendorStaffService.deleteVendorStaff(staffId);
  ApiResponse.success(res, { staffId }, "Staff deleted successfully.");
});

const VendorStaffController = {
  createVendorStaff,
  myVendorStaff,
  singleStaff,
  deleteVendorStaff,
};

export default VendorStaffController;
