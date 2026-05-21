import { z } from "zod";

export const createBookingSchema = z.object({
  checkIn: z.iso
    .datetime({
      message: "Check-in must be a valid ISO datetime",
    }),
  checkOut: z.iso
    .datetime({
      message: "Check-out must be a valid ISO datetime",
    }),
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  userId: z.string().min(1, "User ID is required"),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED"], {
      message: "Status must be PENDING, CONFIRMED, or CANCELLED",
    })
    .optional()
    .default("PENDING"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
