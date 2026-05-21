import express, { Router } from "express";
import * as HotelController from "./hotel.controller.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { zodHotelSchema, zodUpdateHotelSchema } from "./hotel.validation.js";
import { authorize } from "../../middlewares/authorize.js";

const router: Router = express.Router();
router.use(isAuthenticated);
router.post("/", authorize(["CREATE_HOTEL"]), validateRequest(zodHotelSchema),  HotelController.createHotel);
router.get("/",  authorize(["READ_HOTEL"]), HotelController.getAllHotels);
router.patch("/:hotelId", authorize(["UPDATE_HOTEL"]), validateRequest(zodUpdateHotelSchema), HotelController.updateHotel);
router.delete("/:hotelId", authorize(["DELETE_HOTEL"]), HotelController.deleteHotel);

export const HotelRoutes = router;