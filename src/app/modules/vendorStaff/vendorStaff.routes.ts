import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import VendorStaffController from "./vendorStaff.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateVendorStaffSchema } from "./vendorStaff.validation";

const router: Router = Router();
router.use(isAuthenticated);

router.post(
  "/",
  validateRequest(CreateVendorStaffSchema),
  VendorStaffController.createVendorStaff,
);
router.get("/", VendorStaffController.myVendorStaff);
router.get("/:staffId", VendorStaffController.singleStaff);
router.delete("/:staffId", VendorStaffController.deleteVendorStaff);

const VendorStaffRoutes = router;
export default VendorStaffRoutes;
