import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const roomIdBookingIdParamSchema = z.object({
  id: z.string().min(1), // room id
  bookingId: z.string().min(1),
});

export const eventIdStudentIdParamSchema = z.object({
  id: z.string().min(1), // event id
  studentId: z.string().min(1),
});

/** Common list-query shape: pagination + sort are parsed separately via
 * getPagination/getOrderBy (they read from req.query directly), so this
 * schema only needs to allow the extra fields through without stripping
 * them. Each resource's controller defines its own richer filter schema
 * where more specific validation is useful. */
export const paginationQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    sortBy: z.string().optional(),
  })
  .passthrough();
