import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import statusCode from "http-status";
import { CreateBookingInput } from "./booking.interface";

const createBookingIntoDB = async (payload: CreateBookingInput) => {
  const room = await prisma.room.findUnique({
    where: {
      id: payload.roomId,
    },
  });

  if (payload.checkIn >= payload.checkOut) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "Check-out date must be after check-in date!",
    );
  }

  const overLappingBookings = await prisma.booking.findMany({
    where: {
      hotelId: payload.hotelId,
      roomId: payload.roomId,
      status: "CONFIRMED",
      OR: [
        {
          checkIn: {
            lte: payload.checkOut,
          },
          checkOut: {
            gte: payload.checkIn,
          },
        },
      ],
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
    },
  });

  if (overLappingBookings.length > 0) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "The selected room is not available for the chosen dates!",
    );
  }

  if (!room) {
    throw new AppError(statusCode.NOT_FOUND, "Room not found!");
  }

  const pricePerNight = room.basePrice;
  const durationInNights =
    (payload.checkOut.getTime() - payload.checkIn.getTime()) /
    (1000 * 60 * 60 * 24);
  const totalPrice = pricePerNight * durationInNights;

  const result = await prisma.booking.create({
    data: {
      hotelId: payload.hotelId,
      userId: payload.userId,
      roomId: payload.roomId,
      totalPrice: totalPrice,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
    },
  });
  return result;
};

const getMyBookingsFromDB = async (userId: string) => {
  const result = await prisma.booking.findMany({
    where: {
      userId: userId,
    },
    // relation thakle select korte paren, example:
    // select: { hotel: true }
  });
  return result;
};

const getBookingByIdFromDB = async (bookingId: string) => {
  const result = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  // Prisma er findUniqueOrThrow use and it automatically throws an error if no record is found, but here we are manually checking and throwing a custom error for better control and custom message.
  if (!result) {
    throw new AppError(statusCode.NOT_FOUND, "Booking not found!");
  }

  return result;
};

const cancelBookingInDB = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(statusCode.NOT_FOUND, "Booking not found!");
  }

  if (booking.userId !== userId) {
    // FORBIDDEN status code use bcoze user are not authorized to cancel this booking
    throw new AppError(
      statusCode.FORBIDDEN,
      "You are not authorized to cancel this booking!",
    );
  }

  // Call the payment cancellation logic

  const result = await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return result;
};

const extendBooking = async (BookingId: string, newCheckOut: Date) => {
  const booking = await prisma.booking.findUnique({
    where: { id: BookingId },
  });

  if (!booking) {
    throw new AppError(statusCode.NOT_FOUND, "Booking not found!");
  }

  if (newCheckOut <= booking.checkIn) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "New check-out date must be after the current check-in date!",
    );
  }

  const conflictingBookings = await prisma.booking.findMany({
    where: {
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      id: { not: BookingId },
      status: "CONFIRMED",
      AND: [
        {
          checkIn: {
            lte: newCheckOut,
          },
          checkOut: {
            gte: booking.checkIn,
          },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "The selected room is not available for the chosen dates!",
    );
  }

  const result = await prisma.booking.update({
    where: { id: BookingId },
    data: { checkOut: newCheckOut },
  });

  return result;
};

export const BookingService = {
  createBookingIntoDB,
  getMyBookingsFromDB,
  getBookingByIdFromDB,
  cancelBookingInDB,
  extendBooking,
};
