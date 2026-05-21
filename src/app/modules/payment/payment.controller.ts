import { Request, Response } from "express";
import statusCode from "http-status";
import AppError from "../../utils/AppError";
import { PaymentInput } from "./payment.interface";
import paymentService from "./payment.service";
import ENV from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import ApiResponse from "../../utils/ApiResponse";

const initializePayment = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(statusCode.UNAUTHORIZED, "User not authenticated");
  }
  const productId = req.params.productId as string;
  const paymentType = req.params.paymentType as string;
  const payload: PaymentInput = {
    userId: user.userId,
    productId,
    paymentType,
  };
  if (!productId || !user.userId) {
    throw new AppError(statusCode.BAD_REQUEST, "Missing required fields");
  }
  // Call the initializePayment function from the payment service
  // initializePayment(payload);
  const result = await paymentService.initializePayment(payload);

  res.status(200).json({
    success: true,
    statusCode: statusCode.OK,
    data: result,
  });
};

const handleSuccess = async (req: Request, res: Response) => {
  const transId = req.params.transId as string;
  const paymentType = req.params.paymentType as string;
  const paymentId = req.params.paymentId as string;
  const productId = req.params.productId as string;
  if (!transId || !paymentType || !paymentId || !productId) {
    throw new AppError(statusCode.BAD_REQUEST, "Something is wrong");
  }


  await paymentService.paymentSuccess(
    transId,
    paymentId,
    paymentType,
    productId,
  );

  res.json({
    frontendUrl: `${ENV.FRONTEND_URL}/payment/success`,
    transId,
  });
};

const handleFail = async (req: Request, res: Response) => {
  const transId = req.params.transId as string;
  const paymentType = req.params.paymentType as string;
  const paymentId = req.params.paymentId as string;
  const productId = req.params.productId as string;

  await paymentService.paymentFailOrCancel(
    transId,
    paymentId,
    paymentType,
    productId,
  );

  res.json({
    frontendUrl: `${ENV.FRONTEND_URL}/payment/failure`,
    transId,
  });
};

const handleCancel = async (req: Request, res: Response) => {
  const transId = req.params.transId as string;
  const paymentType = req.params.paymentType as string;
  const paymentId = req.params.paymentId as string;
  const productId = req.params.productId as string;
  await paymentService.paymentFailOrCancel(
    transId,
    paymentId,
    paymentType,
    productId,
  );

  res.json(`${ENV.FRONTEND_URL}/payment/cancel`);
};

const getPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(statusCode.BAD_REQUEST, "User is not found!");
  }
  const result = await paymentService.getPayment(userId);
  const payload = {
    statusCode: statusCode.OK,
    success: true,
    message: "Successfully retrieve payment history",
    data: result,
  };

  ApiResponse.success(res, payload.data, payload.message, payload.statusCode);
});

const getPaymentByType = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const paymentType = req.params.paymentType as string;
  if (!paymentType) {
    throw new AppError(statusCode.BAD_REQUEST, "Something is wrong");
  }

  if (!user) {
    throw new AppError(statusCode.BAD_REQUEST, "Something is wrong");
  }

  const result = await paymentService.getPaymentByType(
    user.userId,
    paymentType,
  );
  const payload = {
    statusCode: statusCode.OK,
    success: true,
    message: "Successfully retrieve payment history",
    data: result,
  };

  ApiResponse.success(res, payload.data, payload.message, payload.statusCode);
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params.paymentId as string;
  const paymentType = req.params.paymentType as string;
  if (!paymentId || !paymentType) {
    throw new AppError(statusCode.BAD_REQUEST, "Something is wrong");
  }

  const result = await paymentService.getPaymentById(paymentId, paymentType);
  const payload = {
    statusCode: statusCode.OK,
    success: true,
    message: "Successfully retrieve payment history",
    data: result,
  };

  ApiResponse.success(res, payload.data, payload.message, payload.statusCode);
});

const paymentController = {
  initializePayment,
  handleSuccess,
  handleFail,
  handleCancel,
  getPayment,
  getPaymentById,
  getPaymentByType,
};

export default paymentController;
