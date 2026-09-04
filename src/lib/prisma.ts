import { PrismaClient } from "@prisma/client";

// A single shared Prisma client instance for the whole app.
// (Avoids exhausting DB connections by creating a new client per request.)
export const prisma = new PrismaClient();
