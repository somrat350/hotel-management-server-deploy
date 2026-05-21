import { z } from "zod";

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional(),

  phone: z
    .string()
    .min(11, "Phone number is too short")
    .optional(),
});

export type IUpdateUser = z.infer<typeof updateUserSchema>;

export const updateUserAvatarSchema = z.object({
  avatar: z.string().optional(),
});

export type IUpdateUserAvatar = z.infer<typeof updateUserAvatarSchema>;