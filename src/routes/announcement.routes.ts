import { Router } from "express";
import { validate } from "../middleware/validate";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../validators/announcement.schema";
import { idParamSchema } from "../validators/common.schema";
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listAnnouncements));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getAnnouncement));
router.post("/", validate(createAnnouncementSchema, "body"), asyncHandler(createAnnouncement));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateAnnouncementSchema, "body"),
  asyncHandler(updateAnnouncement)
);
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(deleteAnnouncement));

export default router;
