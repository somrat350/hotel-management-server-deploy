import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createRoleSchema, updateRoleSchema } from "./role.validation";
import RoleController from "./role.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { SystemLevel } from "@prisma/client";
import { authorize } from "../../middlewares/authorize";

const router: Router = Router();

router.use(isAuthenticated);

router.post(
  "/",
  authorize(["CREATE_ROLE"]),
  validateRequest(createRoleSchema),
  RoleController.createRole,
);
router.get("/", authorize(["READ_ROLE"]), RoleController.getAllRoles);
router.get("/:roleId", authorize(["READ_ROLE"]), RoleController.getSingleRole);
router.patch(
  "/:roleId",
  authorize(["UPDATE_ROLE"]),
  validateRequest(updateRoleSchema),
  RoleController.updateRole,
);
router.delete(
  "/:roleId",
  authorize(["DELETE_ROLE"]),
  RoleController.deleteRole,
);
router.post(
  "/:roleId/assignVendorRole",
  RoleController.assignRole(SystemLevel.VENDOR),
);
router.post(
  "/:roleId/assignAdminRole",
  RoleController.assignRole(SystemLevel.ADMIN),
);

const RoleRoutes = router;
export default RoleRoutes;
