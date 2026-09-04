import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Parses `?page=&limit=` into safe, bounded pagination params.
 * Defaults: page=1, limit=20. Limit is capped at 100 to avoid huge scans.
 */
export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const rawLimit = parseInt(String(req.query.limit ?? "20"), 10) || 20;
  const limit = Math.min(Math.max(1, rawLimit), 100);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

/**
 * Parses `?sort=asc|desc` and optional `?sortBy=<field>` into a Prisma
 * `orderBy` object. `sortBy` must be one of `allowedFields`, otherwise
 * `defaultField` is used. Usage from the spec (`?sort=desc`) sorts the
 * default field; pass `sortBy=<field>` to sort a specific column.
 */
export function getOrderBy(
  req: Request,
  allowedFields: string[],
  defaultField: string
): Record<string, "asc" | "desc"> {
  const sortDirRaw = String(req.query.sort ?? "asc").toLowerCase();
  const direction: "asc" | "desc" = sortDirRaw === "desc" ? "desc" : "asc";

  const requestedField = String(req.query.sortBy ?? defaultField);
  const field = allowedFields.includes(requestedField) ? requestedField : defaultField;

  return { [field]: direction };
}

/** Wraps a paginated result in a consistent response envelope. */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: Pick<PaginationParams, "page" | "limit">
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
