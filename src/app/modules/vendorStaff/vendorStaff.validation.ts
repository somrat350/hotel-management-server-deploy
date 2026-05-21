import z from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuidSchema = z
  .string()
  .min(1, "ID is required")
  .regex(uuidRegex, "Invalid UUID format");

export const CreateVendorStaffSchema = z.object({
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(20, "Name cannot exceed 20 characters"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: uuidSchema,
});

export type CreateVendorStaffInput = z.infer<typeof CreateVendorStaffSchema>;
