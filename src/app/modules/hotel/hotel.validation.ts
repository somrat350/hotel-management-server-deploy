import { z } from "zod";

const hotelStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
const roomStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const zodLocationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const zodAmenitiesSchema = z.object({
  wifi: z.boolean().optional(),
  parking: z.boolean().optional(),
  pool: z.boolean().optional(),
  gym: z.boolean().optional(),
});

export const zodRoomSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive(),
  basePrice: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
  status: roomStatusSchema.optional(),
});

export const zodBookingSchema = z.object({
  userId: z.string().min(1),
  checkIn: z.iso.datetime(),
  checkOut: z.iso.datetime(),
  totalPrice: z.coerce.number().positive(),
  status: z.string().optional(),
});

export const zodHotelSchema = z.object({
  name: z.string().min(3, "Hotel name must be at least 3 characters"),
  description: z.string().optional(),
  image: z
    .array(z.string().min(1, "Image URL cannot be empty"))
    .min(1, "At least one image is required")
    .optional(),
  status: hotelStatusSchema.optional(),
  location: zodLocationSchema.optional(),
  amenities: zodAmenitiesSchema.optional(),
  rooms: z.array(zodRoomSchema).optional(),
  bookings: z.array(zodBookingSchema).optional(),
});

export const zodUpdateHotelSchema = z.object({
  name: z
    .string()
    .min(3, "Hotel name must be at least 3 characters")
    .optional(),
  description: z.string().optional(),
  image: z
    .array(z.string().min(1, "Image URL cannot be empty"))
    .min(1, "At least one image is required")
    .optional(),
  status: hotelStatusSchema.optional(),
  location: zodLocationSchema.partial().optional(),
  amenities: zodAmenitiesSchema.partial().optional(),
});
