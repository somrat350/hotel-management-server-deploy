import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  baseUserRegisterSchema,
  loginDataSchema,
  resendOtpDataSchema,
  resetPasswordDataSchema,
  updateProfileDataSchema,
  verifyOtpDataSchema,
} from "./auth.validation";
import AuthController from "./auth.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { upload } from "../../middlewares/multer.middleware";
import { SystemLevel } from "@prisma/client";

const router: Router = Router();

// Auth management
router.post(
  "/customer-register",
  upload.single("avatar"),
  validateRequest(baseUserRegisterSchema),
  AuthController.register(),
);
router.post(
  "/vendor-register",
  upload.single("avatar"),
  validateRequest(baseUserRegisterSchema),
  AuthController.register(SystemLevel.VENDOR),
);

router.post(
  "/resend-account-verify-otp",
  validateRequest(resendOtpDataSchema),
  AuthController.resendAccountVerifyOtp,
);
router.post(
  "/customer-verify-otp",
  validateRequest(verifyOtpDataSchema),
  AuthController.verifyOtp(),
);
router.post(
  "/vendor-verify-otp",
  validateRequest(verifyOtpDataSchema),
  AuthController.verifyOtp(SystemLevel.VENDOR),
);

router.post(
  "/customer-login",
  validateRequest(loginDataSchema),
  AuthController.login(),
);
router.post(
  "/vendor-login",
  validateRequest(loginDataSchema),
  AuthController.login(SystemLevel.VENDOR),
);
router.post(
  "/admin-login",
  validateRequest(loginDataSchema),
  AuthController.login(SystemLevel.ADMIN),
);
router.post("/logout", AuthController.logout);

router.patch(
  "/update-profile",
  isAuthenticated,
  validateRequest(updateProfileDataSchema),
  AuthController.updateProfile,
);

router.post(
  "/forgot-password",
  validateRequest(resendOtpDataSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordDataSchema),
  AuthController.resetPassword,
);

router.get("/customer-refreshAccessToken", AuthController.refreshAccessToken());
router.get(
  "/vendor-refreshAccessToken",
  AuthController.refreshAccessToken(SystemLevel.VENDOR),
);
router.get(
  "/admin-refreshAccessToken",
  AuthController.refreshAccessToken(SystemLevel.ADMIN),
);

const AuthRoutes = router;
export default AuthRoutes;
