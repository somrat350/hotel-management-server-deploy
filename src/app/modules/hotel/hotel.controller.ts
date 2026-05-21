import { Request, Response } from "express";
import HotelRoomService from "./hotel.service.js";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const createHotel = catchAsync(async (req: Request, res: Response) => {
  const { userId }  = req.user;
  const result = await HotelRoomService.createHotel(userId, req.body);
  ApiResponse.success(
    res,
    result,
    "Hotel created successfully.",
    statusCode.CREATED,
  );
});

export const getAllHotels = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelRoomService.getHotels(req.query);
  ApiResponse.paginated(
    res,
    result.hotels,
    result.meta,
    "Hotels retrieved successfully.",
  );
});


export const updateHotel = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const hotelId  = req.params.hotelId as string;

  const result = await HotelRoomService.updateHotel(userId, hotelId, req.body);
  ApiResponse.success(res, result, "Hotel updated successfully.", statusCode.OK)
  
});

export const deleteHotel = catchAsync(async (req: Request, res: Response) => {
  const hotelId = req.params.hotelId as string 

  const result = await HotelRoomService.deleteHotel(hotelId);
  ApiResponse.success(res, result, "Hotel deleted successfully.", statusCode.OK)
});
