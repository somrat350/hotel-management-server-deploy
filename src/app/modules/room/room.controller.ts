import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../utils/AppError";
import status from "http-status";
import { RoomService } from "./room.service";
import  ApiResponse  from "../../utils/ApiResponse"; // আপনার প্রজেক্টের সঠিক পাথ অনুযায়ী চেঞ্জ করে নিয়েন

// Create Room
const createRoom = catchAsync(async (req: Request, res: Response) => {
  // hotelId can come from params
  const hotelId = req.params.hotelId as string;

  if (!hotelId) {
    throw new AppError(status.BAD_REQUEST, "Hotel ID is required");
  }

  const result = await RoomService.createRoom(hotelId, req.body);

  ApiResponse.success(res, result, "Room created successfully", status.CREATED);
});

// get rooms by hotel
const getRoomsByHotelId = catchAsync(async (req: Request, res: Response) => {
  //   hotel id came from params
  const hotelId = req.params.hotelId as string;

  if (!hotelId) {
    throw new AppError(status.BAD_REQUEST, "Hotel ID is required");
  }

  const result = await RoomService.getRoomsByHotel(hotelId);

  ApiResponse.success(res, result, "Rooms fetched successfully", status.OK);
});

// update room by id
const updateRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;

  if (!roomId) {
    throw new AppError(status.BAD_REQUEST, "Room ID is required");
  }

  //    check if room exists frist
  const existRoom = await RoomService.getRoomById(roomId);

  if (!existRoom) {
    throw new AppError(status.NOT_FOUND, "Room not found");
  }

  const result = await RoomService.updateRoom(roomId, req.body);

  ApiResponse.success(res, result, "Room updated successfully", status.OK);
});

// Delete Room
const deleteRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;

  if (!roomId) {
    throw new AppError(status.BAD_REQUEST, "Room ID is required");
  }

  // Check if room exists first
  const existingRoom = await RoomService.getRoomById(roomId);

  if (!existingRoom) {
    throw new AppError(status.NOT_FOUND, "Room not found");
  }

  await RoomService.deleteRoom(roomId);

  ApiResponse.success(res, null, "Room deleted successfully", status.OK);
});

export const RoomController = {
  createRoom,
  getRoomsByHotelId,
  updateRoom,
  deleteRoom,
};