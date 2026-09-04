import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createRoomSchema,
  updateRoomSchema,
  createBookingSchema,
  roomAvailabilityQuerySchema,
} from "../validators/room.schema";
import { idParamSchema, roomIdBookingIdParamSchema } from "../validators/common.schema";
import {
  listRooms,
  findAvailableRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  createBooking,
  cancelBooking,
} from "../controllers/room.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// IMPORTANT: /available must be declared before the /:id catch-all route,
// otherwise Express would try to treat "available" as a room id.
router.get(
  "/available",
  validate(roomAvailabilityQuerySchema, "query"),
  asyncHandler(findAvailableRooms)
);

router.get("/", asyncHandler(listRooms));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getRoom));
router.post("/", validate(createRoomSchema, "body"), asyncHandler(createRoom));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateRoomSchema, "body"),
  asyncHandler(updateRoom)
);
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(deleteRoom));

router.post(
  "/:id/bookings",
  validate(idParamSchema, "params"),
  validate(createBookingSchema, "body"),
  asyncHandler(createBooking)
);
router.delete(
  "/:id/bookings/:bookingId",
  validate(roomIdBookingIdParamSchema, "params"),
  asyncHandler(cancelBooking)
);

export default router;
