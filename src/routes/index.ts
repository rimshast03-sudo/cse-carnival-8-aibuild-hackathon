import { Router } from "express";
import scheduleRoutes from "./schedule.routes";
import roomRoutes from "./room.routes";
import eventRoutes from "./event.routes";
import announcementRoutes from "./announcement.routes";
import assignmentRoutes from "./assignment.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

router.use("/schedules", scheduleRoutes);
router.use("/rooms", roomRoutes);
router.use("/events", eventRoutes);
router.use("/announcements", announcementRoutes);
router.use("/assignments", assignmentRoutes);

export default router;
