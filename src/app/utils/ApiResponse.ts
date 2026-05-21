import { Response } from "express";
import status from "http-status";

interface PaginationOptions {
  page?: number;
  limit: number;
  offset?: number;
  total?: number;
  totalPages?: number;
  cursor?: string;
}

class ApiResponse {
  static success(
    res: Response,
    data: any,  
    message: string = "Success",
    statusCode: number = status.OK,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    const stack = error.stack || "";

    return res.status(statusCode).json({
      success: false,
      message,
      stack,
    });
  }

  static paginated(
    res: Response,
    data: any,
    meta: PaginationOptions | Record<string, unknown>,
    message: string = "Success",
  ) {
    return res.status(status.OK).json({
      success: true,
      message,
      meta,
      data,
    });
  }
}

export default ApiResponse;
