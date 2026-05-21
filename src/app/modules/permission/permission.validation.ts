import z from "zod";

export const disablePermissionValidation = z.object({
  userId: z.string("User id required!"),
  roleId: z.string("Role id required!"),
  permissionId: z.string("Permission id required!"),
});
