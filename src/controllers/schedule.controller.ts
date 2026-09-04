import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { getPagination, getOrderBy, paginatedResponse } from "../utils/query";

const SORTABLE_FIELDS = ["day", "start_time", "end_time", "course", "instructor", "room"];

// GET /api/schedules?page=&limit=&sort=&sortBy=&day=&course=&instructor=&room=&search=
export async function listSchedules(req: Request, res: Response) {
  const { page, limit, skip, take } = getPagination(req);
  const orderBy = getOrderBy(req, SORTABLE_FIELDS, "day");

  const { day, course, instructor, room, search } = req.query;

  const where: any = {};
  if (day) where.day = String(day);
  if (course) where.course = { contains: String(course) };
  if (instructor) where.instructor = { contains: String(instructor) };
  if (room) where.room = String(room);
  if (search) {
    where.OR = [
      { course: { contains: String(search) } },
      { title: { contains: String(search) } },
      { instructor: { contains: String(search) } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({ where, orderBy, skip, take }),
    prisma.schedule.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, limit }));
}

// GET /api/schedules/:id
export async function getSchedule(req: Request, res: Response) {
  const { id } = req.params;
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(`Schedule ${id} not found`, 404);
  res.json(schedule);
}

// POST /api/schedules
export async function createSchedule(req: Request, res: Response) {
  const id = `sch-${Date.now()}`;
  const schedule = await prisma.schedule.create({ data: { id, ...req.body } });
  res.status(201).json(schedule);
}

// PUT /api/schedules/:id
export async function updateSchedule(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Schedule ${id} not found`, 404);

  const schedule = await prisma.schedule.update({ where: { id }, data: req.body });
  res.json(schedule);
}

// DELETE /api/schedules/:id
export async function deleteSchedule(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Schedule ${id} not found`, 404);

  await prisma.schedule.delete({ where: { id } });
  res.status(204).send();
}
