import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import PermissionController from "./permission.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { disablePermissionValidation } from "./permission.validation";

const router: Router = Router();

router.use(isAuthenticated);

router.get("/", PermissionController.getPermissions);
router.post(
  "/disable-permission",
  validateRequest(disablePermissionValidation),
  PermissionController.disablePermission,
);
router.delete(
  "/remove-disabled/:disabledId",
  PermissionController.removeDisabled,
);
router.get("/disabled-by-user/:userId", PermissionController.disabledByUser);

const PermissionRoutes = router;
export default PermissionRoutes;
