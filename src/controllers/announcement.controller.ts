import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { getPagination, getOrderBy, paginatedResponse } from "../utils/query";

const SORTABLE_FIELDS = ["date", "priority", "expires", "title"];

// GET /api/announcements?page=&limit=&sort=&sortBy=&priority=&active=true&search=
export async function listAnnouncements(req: Request, res: Response) {
  const { page, limit, skip, take } = getPagination(req);
  const orderBy = getOrderBy(req, SORTABLE_FIELDS, "date");

  const { priority, active, search } = req.query;

  const where: any = {};
  if (priority) where.priority = String(priority);
  if (active === "true") {
    where.expires = { gte: new Date().toISOString().slice(0, 10) };
  }
  if (search) {
    where.OR = [
      { title: { contains: String(search) } },
      { body: { contains: String(search) } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({ where, orderBy, skip, take }),
    prisma.announcement.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, limit }));
}

// GET /api/announcements/:id
export async function getAnnouncement(req: Request, res: Response) {
  const { id } = req.params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw new AppError(`Announcement ${id} not found`, 404);
  res.json(announcement);
}

// POST /api/announcements
export async function createAnnouncement(req: Request, res: Response) {
  const id = `ann-${Date.now()}`;
  const announcement = await prisma.announcement.create({ data: { id, ...req.body } });
  res.status(201).json(announcement);
}

// PUT /api/announcements/:id
export async function updateAnnouncement(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Announcement ${id} not found`, 404);

  const announcement = await prisma.announcement.update({ where: { id }, data: req.body });
  res.json(announcement);
}

// DELETE /api/announcements/:id
export async function deleteAnnouncement(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Announcement ${id} not found`, 404);

  await prisma.announcement.delete({ where: { id } });
  res.status(204).send();
}
