import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = Router();

// List notifications for the current user (newest first, paginated)
router.get("/", auth(), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId: req.user.id }),
      Notification.countDocuments({ userId: req.user.id, read: false }),
    ]);

    res.json({ notifications, total, unreadCount, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get unread count only (lightweight poll endpoint)
router.get("/unread-count", auth(), async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark a single notification as read
router.patch("/:id/read", auth(), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark all notifications as read for current user
router.patch("/read-all", auth(), async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
