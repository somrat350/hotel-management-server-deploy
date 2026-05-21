import { Router } from "express";
import paymentController from "./payment.controller.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";

const router: Router = Router();
// Apply authentication middleware to all payment routes
router.use(isAuthenticated);
router.post("/initialize/:productId/:paymentType", paymentController.initializePayment);
router.post("/success/:transId/:productId/:paymentType/:paymentId", paymentController.handleSuccess);
router.post("/failure/:transId/:productId/:paymentType/:paymentId", paymentController.handleFail);
router.post("/cancel/:transId/:productId/:paymentType/:paymentId", paymentController.handleCancel);

router.get("/",paymentController.getPayment);
router.get("/:paymentType",paymentController.getPaymentByType);
router.get("/:paymentId/:paymentType",paymentController.getPaymentById);


export const paymentRoutes = router;
