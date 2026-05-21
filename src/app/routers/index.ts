import { Router } from "express";
import { HotelRoutes } from "../modules/hotel/hotel.routes";
import AuthRoutes from "../modules/auth/auth.routes";
import { BookingRoutes } from "../modules/booking/booking.routes";
import RoleRoutes from "../modules/role/role.routes";
import AdminRoutes from "../modules/admin/admin.routes";
import { paymentRoutes } from "../modules/payment/payment.route";
import { RoomRoutes } from "../modules/room/room.routes";
import HotelFAQRoutes from "../modules/hotelFAQ/hotelFAQ.routes";
import { ReviewRoutes } from "../modules/review/review.routes";
import { CommissionRoutes } from "../modules/commission/commission.route";
import { ChatRoutes } from "../modules/chat/chat.routes";
import VendorStaffRoutes from "../modules/vendorStaff/vendorStaff.routes";
import PermissionRoutes from "../modules/permission/permission.routes";
import { userRoutes } from "../modules/user/user.roues";

const router: Router = Router();

const moduleRouters = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/hotels",
    route: HotelRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/role",
    route: RoleRoutes,
  },
  {
    path: "/permission",
    route: PermissionRoutes,
  },
  {
    path: "/bookings",
    route: BookingRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/rooms",
    route: RoomRoutes,
  },
  {
    path: "/hotelFAQ",
    route: HotelFAQRoutes,
  },
  { path: "/commission", route: CommissionRoutes },
  {
    path: "/reviews",
    route: ReviewRoutes
  },
  {
    path: "/chat",
    route: ChatRoutes,
  },
  {
    path: "/vendorStaff",
    route: VendorStaffRoutes,
  },
  {
    path: "/user",
    route: userRoutes,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));

export default router;
