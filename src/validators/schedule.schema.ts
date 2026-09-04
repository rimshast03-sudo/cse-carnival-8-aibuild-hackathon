import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;

export const createScheduleSchema = z.object({
  course: z.string().min(1),
  title: z.string().min(1),
  day: z.enum(days),
  start_time: z.string().regex(timeRegex, "start_time must be HH:MM (24h)"),
  end_time: z.string().regex(timeRegex, "end_time must be HH:MM (24h)"),
  room: z.string().min(1),
  instructor: z.string().min(1),
  section: z.string().min(1),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const idParamSchema = z.object({
  id: z.string().min(1),
});
