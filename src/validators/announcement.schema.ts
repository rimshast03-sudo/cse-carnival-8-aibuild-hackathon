import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
  priority: z.enum(["high", "medium", "low"]),
  posted_by: z.string().min(1),
  expires: z.string().regex(dateRegex, "expires must be YYYY-MM-DD"),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
