import { Router } from "express";
import { validate } from "../middleware/validate";
import { createAssignmentSchema, updateAssignmentSchema } from "../validators/assignment.schema";
import { idParamSchema } from "../validators/common.schema";
import {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignment.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listAssignments));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getAssignment));
router.post("/", validate(createAssignmentSchema, "body"), asyncHandler(createAssignment));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateAssignmentSchema, "body"),
  asyncHandler(updateAssignment)
);
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(deleteAssignment));

export default router;
