import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
  start_time: z.string().regex(timeRegex, "start_time must be HH:MM (24h)"),
  end_time: z.string().regex(timeRegex, "end_time must be HH:MM (24h)"),
  end_date: z.string().regex(dateRegex, "end_date must be YYYY-MM-DD"),
  venue: z.string().min(1),
  organizer: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled", "full"]).default("upcoming"),
});

export const updateEventSchema = createEventSchema.partial();

export const registerForEventSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
});
