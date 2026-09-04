import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { getPagination, getOrderBy, paginatedResponse } from "../utils/query";

const SORTABLE_FIELDS = ["deadline", "assigned_date", "course", "status", "marks"];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// GET /api/assignments?page=&limit=&sort=&sortBy=&status=&course=&dueThisWeek=true&search=
export async function listAssignments(req: Request, res: Response) {
  const { page, limit, skip, take } = getPagination(req);
  const orderBy = getOrderBy(req, SORTABLE_FIELDS, "deadline");

  const { status, course, dueThisWeek, search } = req.query;

  const where: any = {};
  if (status) where.status = String(status);
  if (course) where.course = { contains: String(course) };
  if (search) {
    where.OR = [
      { title: { contains: String(search) } },
      { description: { contains: String(search) } },
    ];
  }
  if (dueThisWeek === "true") {
    const today = new Date();
    const weekOut = addDays(today, 7);
    where.deadline = {
      gte: today.toISOString().slice(0, 10),
      lte: weekOut.toISOString().slice(0, 10),
    };
  }

  const [data, total] = await Promise.all([
    prisma.assignment.findMany({ where, orderBy, skip, take }),
    prisma.assignment.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, limit }));
}

// GET /api/assignments/:id
export async function getAssignment(req: Request, res: Response) {
  const { id } = req.params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) throw new AppError(`Assignment ${id} not found`, 404);
  res.json(assignment);
}

// POST /api/assignments
export async function createAssignment(req: Request, res: Response) {
  const id = `asgn-${Date.now()}`;
  const assignment = await prisma.assignment.create({ data: { id, ...req.body } });
  res.status(201).json(assignment);
}

// PUT /api/assignments/:id
export async function updateAssignment(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Assignment ${id} not found`, 404);

  const assignment = await prisma.assignment.update({ where: { id }, data: req.body });
  res.json(assignment);
}

// DELETE /api/assignments/:id
export async function deleteAssignment(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Assignment ${id} not found`, 404);

  await prisma.assignment.delete({ where: { id } });
  res.status(204).send();
}
