import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { getPagination, getOrderBy, paginatedResponse } from "../utils/query";
import { parseEquipment, serializeEquipment, serializeRoom, timeRangesOverlap } from "../utils/room";

const SORTABLE_FIELDS = ["room_number", "capacity", "floor", "type", "status"];

// GET /api/rooms?page=&limit=&sort=&sortBy=&type=&status=&minCapacity=&equipment=projector,AC&floor=
export async function listRooms(req: Request, res: Response) {
  const { page, limit, skip, take } = getPagination(req);
  const orderBy = getOrderBy(req, SORTABLE_FIELDS, "room_number");

  const { type, status, minCapacity, floor } = req.query;

  const where: any = {};
  if (type) where.type = String(type);
  if (status) where.status = String(status);
  if (floor) where.floor = Number(floor);
  if (minCapacity) where.capacity = { gte: Number(minCapacity) };

  // equipment filtering happens in-memory after the DB query, since
  // equipment is stored as a JSON string rather than a queryable column.
  const requestedEquipment = req.query.equipment
    ? String(req.query.equipment).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const [allMatching, total] = await Promise.all([
    prisma.room.findMany({ where, orderBy, include: { bookings: true } }),
    prisma.room.count({ where }),
  ]);

  let filtered = allMatching;
  if (requestedEquipment.length > 0) {
    filtered = filtered.filter((room) => {
      const roomEquipment = parseEquipment(room.equipment).map((e) => e.toLowerCase());
      return requestedEquipment.every((item) => roomEquipment.includes(item));
    });
  }

  const page_data = filtered.slice(skip, skip + take).map(serializeRoom);
  const effectiveTotal = requestedEquipment.length > 0 ? filtered.length : total;

  res.json(paginatedResponse(page_data, effectiveTotal, { page, limit }));
}

// GET /api/rooms/available?date=&start_time=&end_time=&minCapacity=&equipment=&type=
// Finds rooms that are `available` status AND have no booking overlapping the requested window.
export async function findAvailableRooms(req: Request, res: Response) {
  const { date, start_time, end_time, minCapacity, equipment, type } = req.query as Record<
    string,
    string | undefined
  >;

  const where: any = { status: "available" };
  if (type) where.type = type;
  if (minCapacity) where.capacity = { gte: Number(minCapacity) };

  const rooms = await prisma.room.findMany({ where, include: { bookings: true } });

  const requestedEquipment = equipment
    ? equipment.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const available = rooms.filter((room) => {
    if (requestedEquipment.length > 0) {
      const roomEquipment = parseEquipment(room.equipment).map((e) => e.toLowerCase());
      if (!requestedEquipment.every((e) => roomEquipment.includes(e))) return false;
    }

    // If no time window was given, just return rooms matching capacity/equipment/type.
    if (!date || !start_time || !end_time) return true;

    const conflict = room.bookings.some(
      (b) => b.date === date && timeRangesOverlap(start_time, end_time, b.start_time, b.end_time)
    );
    return !conflict;
  });

  res.json({ data: available.map(serializeRoom), count: available.length });
}

// GET /api/rooms/:id
export async function getRoom(req: Request, res: Response) {
  const { id } = req.params;
  const room = await prisma.room.findUnique({ where: { id }, include: { bookings: true } });
  if (!room) throw new AppError(`Room ${id} not found`, 404);
  res.json(serializeRoom(room));
}

// POST /api/rooms
export async function createRoom(req: Request, res: Response) {
  const id = `room-${Date.now()}`;
  const { equipment, ...rest } = req.body;
  const room = await prisma.room.create({
    data: { id, ...rest, equipment: serializeEquipment(equipment) },
    include: { bookings: true },
  });
  res.status(201).json(serializeRoom(room));
}

// PUT /api/rooms/:id
export async function updateRoom(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Room ${id} not found`, 404);

  const { equipment, ...rest } = req.body;
  const data: any = { ...rest };
  if (equipment !== undefined) data.equipment = serializeEquipment(equipment);

  const room = await prisma.room.update({ where: { id }, data, include: { bookings: true } });
  res.json(serializeRoom(room));
}

// DELETE /api/rooms/:id
export async function deleteRoom(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Room ${id} not found`, 404);

  await prisma.room.delete({ where: { id } }); // bookings cascade-delete
  res.status(204).send();
}

// POST /api/rooms/:id/bookings
export async function createBooking(req: Request, res: Response) {
  const { id } = req.params;
  const { booked_by, date, start_time, end_time, purpose } = req.body;

  const room = await prisma.room.findUnique({ where: { id }, include: { bookings: true } });
  if (!room) throw new AppError(`Room ${id} not found`, 404);
  if (room.status !== "available") {
    throw new AppError(`Room ${room.room_number} is marked unavailable and cannot be booked`, 409);
  }

  const conflict = room.bookings.find(
    (b) => b.date === date && timeRangesOverlap(start_time, end_time, b.start_time, b.end_time)
  );
  if (conflict) {
    throw new AppError(
      `Room ${room.room_number} is already booked on ${date} from ${conflict.start_time} to ${conflict.end_time}`,
      409
    );
  }

  const booking = await prisma.booking.create({
    data: {
      booking_id: `bk-${Date.now()}`,
      booked_by,
      date,
      start_time,
      end_time,
      purpose,
      roomId: room.id,
    },
  });

  res.status(201).json(booking);
}

// DELETE /api/rooms/:id/bookings/:bookingId
export async function cancelBooking(req: Request, res: Response) {
  const { id, bookingId } = req.params;

  const booking = await prisma.booking.findFirst({ where: { roomId: id, booking_id: bookingId } });
  if (!booking) throw new AppError(`Booking ${bookingId} not found for room ${id}`, 404);

  await prisma.booking.delete({ where: { id: booking.id } });
  res.status(204).send();
}
