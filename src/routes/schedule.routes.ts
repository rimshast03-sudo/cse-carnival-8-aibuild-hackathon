import { Router } from "express";
import { validate } from "../middleware/validate";
import { createScheduleSchema, updateScheduleSchema } from "../validators/schedule.schema";
import { idParamSchema } from "../validators/common.schema";
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedule.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listSchedules));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getSchedule));
router.post("/", validate(createScheduleSchema, "body"), asyncHandler(createSchedule));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateScheduleSchema, "body"),
  asyncHandler(updateSchedule)
);
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(deleteSchedule));

export default router;
