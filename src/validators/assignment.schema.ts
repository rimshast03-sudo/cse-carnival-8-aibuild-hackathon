import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAssignmentSchema = z.object({
  course: z.string().min(1),
  course_title: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  assigned_date: z.string().regex(dateRegex, "assigned_date must be YYYY-MM-DD"),
  deadline: z.string().regex(dateRegex, "deadline must be YYYY-MM-DD"),
  submission_platform: z.string().min(1),
  status: z.enum(["pending", "submitted", "graded", "late"]).default("pending"),
  marks: z.number().int().nonnegative(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();
