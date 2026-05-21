import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import commissionService from "./commission.service";
import status from "http-status";
import ApiResponse from "../../utils/ApiResponse";

const getCommission = catchAsync(async (req: Request, res: Response) => {
  const hotelId = req.params.hotelId as string;
  const result = await commissionService.getCommission(hotelId);
  const payload = {
    statusCode: status.OK,
    success: true,
    message: "My commission retrieved successfully.",
    data: result,
  };
  ApiResponse.success(res, payload.data, payload.message, payload.statusCode);
});

const getCommissionById = catchAsync(async (req: Request, res: Response) => {
  console.log("this is from controller file");
  const commissionId = req.params.commissionId as string;
  const result = await commissionService.getCommissionById(commissionId);
  console.log("result : ", result);

  const payload = {
    statusCode: status.OK,
    success: true,
    message: "Get commission history",
    data: result,
  };
  ApiResponse.success(res, payload.data, payload.message, payload.statusCode);
});

const commissionController = {
  getCommission,
  getCommissionById,
};

export default commissionController;
