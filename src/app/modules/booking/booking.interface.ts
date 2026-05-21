import { Prisma } from "@prisma/client";

export type BookingPayload = Prisma.BookingUncheckedCreateInput;

export interface CreateBookingInput {
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status?: string;
}
