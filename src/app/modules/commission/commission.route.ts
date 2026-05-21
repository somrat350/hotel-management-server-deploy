import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import commissionController from "./commission.controller";

const router: Router = Router();
router.use(isAuthenticated);
router.get("/:hotelId", commissionController.getCommission);
router.get("/:commissionId", commissionController.getCommissionById);

export const CommissionRoutes = router;
