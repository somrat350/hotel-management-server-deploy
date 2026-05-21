import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { askFAQSchema } from "./hotelFAQ.validation";
import HotelFAQController from "./hotelFAQ.controller";

const router: Router = Router();

router.post(
  "/:hotelId",
  validateRequest(askFAQSchema),
  HotelFAQController.askQuestion,
);
router.get("/:hotelId", HotelFAQController.getHotelFAQ);

// Hotel FAQ Manager
router.get("/:hotelId/manage", HotelFAQController.getAllHotelFAQ);
router.patch("/:faqId/answer", HotelFAQController.answerQuestion);
router.patch("/:faqId/hide", HotelFAQController.hideQuestion);

const HotelFAQRoutes = router;
export default HotelFAQRoutes;
