import express, { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { authorize } from "../../middlewares/authorize";
import { RoomController } from "./room.controller";
import { PERMISSIONS } from "../../constants/rolePermissions";
import { validateRequest } from "../../middlewares/validateRequest";
import { createRoomDataSchema } from "./room.validation";

const router: Router = express.Router();

// create room only admin&vendor can create room

router.post(
  "/:hotelId",
  validateRequest(createRoomDataSchema),
  // isAuthenticated,
  // authorize([PERMISSIONS.MANAGE_HOTEL,PERMISSIONS.MANAGE_ROOMS]),
  RoomController.createRoom,
);

// get all rooms by hotel id
router.get("/hotel/:hotelId", RoomController.getRoomsByHotelId);

// update room by id only admin&vendor can update room

router.patch(
  "/:roomId",
  //   isAuthenticated,
  // authorize([PERMISSIONS.MANAGE_HOTEL, PERMISSIONS.MANAGE_ROOMS]),
  RoomController.updateRoom,
);

//delete room by id only admin&vendor can delete room
router.delete(
  "/:roomId",
  // isAuthenticated,
  // authorize([PERMISSIONS.MANAGE_HOTEL, PERMISSIONS.MANAGE_ROOMS]),
  RoomController.deleteRoom,
);

export const RoomRoutes = router;
