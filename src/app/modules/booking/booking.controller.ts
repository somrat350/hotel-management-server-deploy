import type { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { BookingService } from "./booking.service";
import { CreateBookingInput } from "./booking.interface";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  // auth middleware req.user
  const { userId } = req.user;
  const { hotelId, roomId, checkIn, checkOut } = req.body;

  const payload: CreateBookingInput = {
    hotelId,
    roomId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    userId,
  };

  const result = await BookingService.createBookingIntoDB(payload);
  const payloadData = {
    statusCode: statusCode.CREATED,
    success: true,
    message: "Booking created successfully.",
    data: result,
  };
  ApiResponse.success(
    res,
    payloadData.data,
    payloadData.message,
    payloadData.statusCode,
  );
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(statusCode.NOT_FOUND, "User is not found!");
  }
  const result = await BookingService.getMyBookingsFromDB(user.userId);
  const payloadData = {
    statusCode: statusCode.OK,
    success: true,
    message: "Successfully retrieve Booking data.",
    data: result,
  };
  ApiResponse.success(
    res,
    payloadData.data,
    payloadData.message,
    payloadData.statusCode,
  );
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const result = await BookingService.getBookingByIdFromDB(bookingId as string);
  const payloadData = {
    statusCode: statusCode.OK,
    success: true,
    message: "Booking details retrieved successfully.",
    data: result,
  };
  ApiResponse.success(
    res,
    payloadData.data,
    payloadData.message,
    payloadData.statusCode,
  );
});

// canceled Booking
const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const user = req.user;
  if (!user) {
    throw new AppError(statusCode.BAD_REQUEST, "User Id is required");
  }
  if (!bookingId) {
    throw new AppError(statusCode.BAD_REQUEST, "Booking ID is required");
  }

  const result = await BookingService.cancelBookingInDB(bookingId, user.userId);
  const payloadData = {
    statusCode: statusCode.OK,
    success: true,
    message: "Booking cancelled successfully.",
    data: result,
  };
  ApiResponse.success(
    res,
    payloadData.data,
    payloadData.message,
    payloadData.statusCode,
  );
});

const extendBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const { newCheckOut } = req.body;
  if (!newCheckOut) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "New check-out date is required",
    );
  }

  if (bookingId === undefined) {
    throw new AppError(statusCode.BAD_REQUEST, "Booking ID is required");
  }
  const result = await BookingService.extendBooking(
    bookingId,
    new Date(newCheckOut),
  );

  const payloadData = {
    statusCode: statusCode.OK,
    success: true,
    message: "Booking extended successfully.",
    data: result,
  };
  ApiResponse.success(
    res,
    payloadData.data,
    payloadData.message,
    payloadData.statusCode,
  );
});

export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  extendBooking,
};
