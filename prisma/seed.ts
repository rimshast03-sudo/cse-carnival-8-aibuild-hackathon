/**
 * Seed script — loads the five seed JSON files (in ../data) into the database.
 *
 * Idempotent: safe to run more than once. It upserts each record by its
 * stable `id` from the seed files, so re-running won't create duplicates.
 * Nested arrays (room bookings, event registrations) are fully replaced
 * on each run so they always mirror the seed file's initial state.
 *
 * Run with: npm run seed
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, "..", "data");

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function seedSchedules() {
  const schedules = loadJson<any[]>("schedules.json");
  for (const s of schedules) {
    await prisma.schedule.upsert({
      where: { id: s.id },
      update: { ...s },
      create: { ...s },
    });
  }
  console.log(`Seeded ${schedules.length} schedules`);
}

async function seedRooms() {
  const rooms = loadJson<any[]>("rooms.json");
  for (const r of rooms) {
    const room = await prisma.room.upsert({
      where: { id: r.id },
      update: {
        room_number: r.room_number,
        type: r.type,
        capacity: r.capacity,
        equipment: JSON.stringify(r.equipment ?? []),
        floor: r.floor,
        status: r.status,
      },
      create: {
        id: r.id,
        room_number: r.room_number,
        type: r.type,
        capacity: r.capacity,
        equipment: JSON.stringify(r.equipment ?? []),
        floor: r.floor,
        status: r.status,
      },
    });

    // Replace bookings to match seed file exactly on each seed run.
    await prisma.booking.deleteMany({ where: { roomId: room.id } });
    for (const b of r.bookings ?? []) {
      await prisma.booking.create({
        data: {
          booking_id: b.booking_id,
          booked_by: b.booked_by,
          date: b.date,
          start_time: b.start_time,
          end_time: b.end_time,
          purpose: b.purpose,
          roomId: room.id,
        },
      });
    }
  }
  console.log(`Seeded ${rooms.length} rooms (with bookings)`);
}

async function seedEvents() {
  const events = loadJson<any[]>("events.json");
  for (const e of events) {
    const event = await prisma.event.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        description: e.description,
        date: e.date,
        start_time: e.start_time,
        end_time: e.end_time,
        end_date: e.end_date,
        venue: e.venue,
        organizer: e.organizer,
        capacity: e.capacity,
        registered: e.registered,
        status: e.status,
      },
      create: {
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date,
        start_time: e.start_time,
        end_time: e.end_time,
        end_date: e.end_date,
        venue: e.venue,
        organizer: e.organizer,
        capacity: e.capacity,
        registered: e.registered,
        status: e.status,
      },
    });

    await prisma.registration.deleteMany({ where: { eventId: event.id } });
    for (const reg of e.registrations ?? []) {
      await prisma.registration.create({
        data: {
          student_id: reg.student_id,
          name: reg.name,
          eventId: event.id,
        },
      });
    }
  }
  console.log(`Seeded ${events.length} events (with registrations)`);
}

async function seedAnnouncements() {
  const announcements = loadJson<any[]>("announcements.json");
  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    });
  }
  console.log(`Seeded ${announcements.length} announcements`);
}

async function seedAssignments() {
  const assignments = loadJson<any[]>("assignments.json");
  for (const a of assignments) {
    await prisma.assignment.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    });
  }
  console.log(`Seeded ${assignments.length} assignments`);
}

async function main() {
  console.log("Seeding CampusOS database...");
  await seedSchedules();
  await seedRooms();
  await seedEvents();
  await seedAnnouncements();
  await seedAssignments();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
