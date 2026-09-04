import { Router } from "express";
import { validate } from "../middleware/validate";
import { createEventSchema, updateEventSchema, registerForEventSchema } from "../validators/event.schema";
import { idParamSchema, eventIdStudentIdParamSchema } from "../validators/common.schema";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
} from "../controllers/event.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listEvents));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getEvent));
router.post("/", validate(createEventSchema, "body"), asyncHandler(createEvent));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateEventSchema, "body"),
  asyncHandler(updateEvent)
);
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(deleteEvent));

router.post(
  "/:id/register",
  validate(idParamSchema, "params"),
  validate(registerForEventSchema, "body"),
  asyncHandler(registerForEvent)
);
router.delete(
  "/:id/register/:studentId",
  validate(eventIdStudentIdParamSchema, "params"),
  asyncHandler(cancelRegistration)
);

export default router;
