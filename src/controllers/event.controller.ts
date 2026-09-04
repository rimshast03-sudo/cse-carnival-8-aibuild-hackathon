import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { getPagination, getOrderBy, paginatedResponse } from "../utils/query";

const SORTABLE_FIELDS = ["date", "name", "capacity", "registered", "status"];

// GET /api/events?page=&limit=&sort=&sortBy=&status=&organizer=&search=&upcoming=true
export async function listEvents(req: Request, res: Response) {
  const { page, limit, skip, take } = getPagination(req);
  const orderBy = getOrderBy(req, SORTABLE_FIELDS, "date");

  const { status, organizer, search, upcoming } = req.query;

  const where: any = {};
  if (status) where.status = String(status);
  if (organizer) where.organizer = { contains: String(organizer) };
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { description: { contains: String(search) } },
    ];
  }
  if (upcoming === "true") {
    where.date = { gte: new Date().toISOString().slice(0, 10) };
  }

  const [data, total] = await Promise.all([
    prisma.event.findMany({ where, orderBy, skip, take, include: { registrations: true } }),
    prisma.event.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, limit }));
}

// GET /api/events/:id
export async function getEvent(req: Request, res: Response) {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id }, include: { registrations: true } });
  if (!event) throw new AppError(`Event ${id} not found`, 404);
  res.json(event);
}

// POST /api/events
export async function createEvent(req: Request, res: Response) {
  const id = `evt-${Date.now()}`;
  const event = await prisma.event.create({
    data: { id, ...req.body, registered: 0 },
    include: { registrations: true },
  });
  res.status(201).json(event);
}

// PUT /api/events/:id
export async function updateEvent(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Event ${id} not found`, 404);

  const event = await prisma.event.update({
    where: { id },
    data: req.body,
    include: { registrations: true },
  });
  res.json(event);
}

// DELETE /api/events/:id
export async function deleteEvent(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Event ${id} not found`, 404);

  await prisma.event.delete({ where: { id } }); // registrations cascade-delete
  res.status(204).send();
}

// POST /api/events/:id/register
export async function registerForEvent(req: Request, res: Response) {
  const { id } = req.params;
  const { student_id, name } = req.body;

  const event = await prisma.event.findUnique({ where: { id }, include: { registrations: true } });
  if (!event) throw new AppError(`Event ${id} not found`, 404);

  if (event.status === "cancelled" || event.status === "completed") {
    throw new AppError(`Cannot register — event is ${event.status}`, 409);
  }
  if (event.registered >= event.capacity) {
    throw new AppError(`Event "${event.name}" is at full capacity (${event.capacity})`, 409);
  }
  if (event.registrations.some((r) => r.student_id === student_id)) {
    throw new AppError(`Student ${student_id} is already registered for this event`, 409);
  }

  const [registration, updatedEvent] = await prisma.$transaction([
    prisma.registration.create({ data: { student_id, name, eventId: id } }),
    prisma.event.update({
      where: { id },
      data: {
        registered: { increment: 1 },
        status: event.registered + 1 >= event.capacity ? "full" : event.status,
      },
      include: { registrations: true },
    }),
  ]);

  res.status(201).json({ registration, event: updatedEvent });
}

// DELETE /api/events/:id/register/:studentId
export async function cancelRegistration(req: Request, res: Response) {
  const { id, studentId } = req.params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError(`Event ${id} not found`, 404);

  const registration = await prisma.registration.findFirst({
    where: { eventId: id, student_id: studentId },
  });
  if (!registration) throw new AppError(`Student ${studentId} is not registered for this event`, 404);

  await prisma.$transaction([
    prisma.registration.delete({ where: { id: registration.id } }),
    prisma.event.update({
      where: { id },
      data: {
        registered: { decrement: 1 },
        // If the event was full and a spot just opened up, it's upcoming again.
        status: event.status === "full" ? "upcoming" : event.status,
      },
    }),
  ]);

  res.status(204).send();
}
