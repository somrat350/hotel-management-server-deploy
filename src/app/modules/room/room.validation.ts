import { z } from "zod";
import { be } from "zod/locales";

export const createRoomDataSchema = z
  .object({
    name: z
      .string()
      .min(3, "Room name must be at least 3 characters")
      .max(50, "Room name cannot exceed 50 characters"),
    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .max(20, "Capacity cannot exceed 20 guests"),
    basePrice: z.number().positive("Base price must be a positive number"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    bedType: z.string().min(3, "Bed type is required"),

    size: z.number().positive("Size must be positive").optional(),

    amenities: z
      .array(
        z.enum([
          "WIFI",
          "AC",
          "TV",
          "PARKING",
          "BREAKFAST",
          "POOL",
          "GYM",
          "ROOM_SERVICE",
        ]),
      )
      .min(1, "At least one amenity is required"),

    images: z
      .array(z.url("Each image must be a valid URL"))
      .min(1, "At least one image is required"),
  })
  .strict();

export const updateRoomDataSchema = z
  .object({
    name: z
      .string()
      .min(3, "Room name must be at least 3 characters")
      .max(50, "Room name cannot exceed 50 characters")
      .optional(),
    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .max(20, "Capacity cannot exceed 20 guests")
      .optional(),
    basePrice: z
      .number()
      .positive("Base price must be a positive number")
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional(),

    bedType: z.string().min(3, "Bed type is required").optional(),

    size: z.number().positive("Size must be positive").optional(),
    amenities: z
      .array(
        z.enum([
          "WIFI",
          "AC",
          "TV",
          "PARKING",
          "BREAKFAST",
          "POOL",
          "GYM",
          "ROOM_SERVICE",
        ]),
      )
      .optional(),

    images: z
      .array(z.url("Each image must be a valid URL"))
      .min(1, "At least one image is required")
      .optional(),
  })
  .strict();

export type IRoomUpdateInput = z.infer<typeof updateRoomDataSchema>;

export type IRoomCreateInput = z.infer<typeof createRoomDataSchema>;
