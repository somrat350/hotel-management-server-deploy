import { Router } from "express";
import { BookingController } from "./booking.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBookingSchema } from "./booking.validation";

const router:Router = Router();
router.use(isAuthenticated);
// Create a booking
router.post(
  "/",
  validateRequest(createBookingSchema),
  BookingController.createBooking,
);

// Get my bookings
router.get("/me", BookingController.getMyBookings);

// Get booking by ID
router.get("/:bookingId", BookingController.getBookingById);

// Cancel a booking
router.post(
  "/:bookingId/cancel",
  BookingController.cancelBooking,
);

// Extend a booking
router.patch(
  "/:bookingId/extend",
  BookingController.extendBooking,
);

export const BookingRoutes = router;
