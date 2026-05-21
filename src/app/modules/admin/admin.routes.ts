import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateAdminSchema } from "./admin.validation";
import AdminController from "./admin.controller";
import { authorize } from "../../middlewares/authorize";

const router: Router = Router();
router.use(isAuthenticated);

router.post(
  "/",
  authorize(["CREATE_ADMIN_STAFF"]),
  validateRequest(CreateAdminSchema),
  AdminController.createAdmin,
);
router.get("/", authorize(["READ_ADMIN_STAFF"]), AdminController.myAdmins);
router.get(
  "/:adminId",
  authorize(["READ_ADMIN_STAFF"]),
  AdminController.singleAdmin,
);
router.delete(
  "/:adminId",
  authorize(["DELETE_ADMIN_STAFF"]),
  AdminController.deleteAdmin,
);

const AdminRoutes = router;
export default AdminRoutes;
