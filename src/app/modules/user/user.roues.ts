import { Router } from "express";
import { UserController } from "./user.controller";
import { upload } from "../../middlewares/multer.middleware";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router: Router = Router();
router.use(isAuthenticated);

router.patch("/update-name-phone", UserController.updateUserProfile);
router.patch(
  "/update-avatar",
  upload.single("avatar"),
  UserController.updateUserAvatar,
);

export const userRoutes = router;
