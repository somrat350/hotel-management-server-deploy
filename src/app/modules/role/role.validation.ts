import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuidSchema = z
  .string()
  .min(1, "ID is required")
  .regex(uuidRegex, "Invalid UUID format");

export const createRoleSchema = z
  .object({
    name: z.string().min(2).max(50),
    creatorId: uuidSchema,
    permissions: z.array(uuidSchema),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(uuidSchema).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
