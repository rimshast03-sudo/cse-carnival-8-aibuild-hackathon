import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createRoomSchema = z.object({
  room_number: z.string().min(1),
  type: z.enum(["classroom", "lab", "seminar"]),
  capacity: z.number().int().positive(),
  equipment: z.array(z.string()).default([]),
  floor: z.number().int(),
  status: z.enum(["available", "unavailable"]).default("available"),
});

export const updateRoomSchema = createRoomSchema.partial();

export const createBookingSchema = z
  .object({
    booked_by: z.string().min(1),
    date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
    start_time: z.string().regex(timeRegex, "start_time must be HH:MM (24h)"),
    end_time: z.string().regex(timeRegex, "end_time must be HH:MM (24h)"),
    purpose: z.string().min(1),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: "start_time must be before end_time",
    path: ["start_time"],
  });

export const roomAvailabilityQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  start_time: z.string().regex(timeRegex).optional(),
  end_time: z.string().regex(timeRegex).optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  equipment: z.string().optional(), // comma-separated, e.g. "projector,AC"
  type: z.enum(["classroom", "lab", "seminar"]).optional(),
});
