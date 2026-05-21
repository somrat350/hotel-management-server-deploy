import { z } from "zod";

export const baseUserRegisterSchema = z.object({
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(20, "Name cannot exceed 20 characters"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatar: z.url("Avatar must be a valid URL").optional(),
});

export const resendOtpDataSchema = z
  .object({
    email: z.email("Invalid email address"),
  })
  .strict();

export const verifyOtpDataSchema = z
  .object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  })
  .strict();

export const loginDataSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();

export const updateProfileDataSchema = z
  .object({
    name: z
      .string()
      .min(5, "Name must be at least 5 characters")
      .max(20, "Name cannot exceed 20 characters")
      .optional(),
    phone: z.string().min(1, "Phone number is required").optional(),
    avatar: z.url("Profile picture must be a valid URL").optional(),
    nidFront: z.string().optional(),
    nidBack: z.string().optional(),
  })
  .strict();

export const resetPasswordDataSchema = z
  .object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();
