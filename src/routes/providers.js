import { Router } from "express";
import User from "../models/User.js";
import Review from "../models/Review.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// ── Get own provider profile ──────────────────────────────────────────────────
router.get("/me", auth(["provider"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Update own provider profile ───────────────────────────────────────────────
router.post("/me", auth(["provider"]), async (req, res) => {
  try {
    const { categories, location, phone, bio, avatar } = req.body;
    const updates = {};
    if (categories) updates.categories = categories;
    if (location) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── List providers (public, with filters) ─────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, lng, lat, radius = 10, page = 1, limit = 20 } = req.query;

    const query = { role: "provider", isActive: true };
    if (category) query.categories = category;

    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [providers, total] = await Promise.all([
      User.find(query)
        .select("name email categories location phone bio avatar createdAt")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({ providers, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get any user's public profile ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name categories location phone bio avatar role createdAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Attach rating summary for providers
    let ratingSummary = null;
    if (user.role === "provider") {
      const mongoose = (await import("mongoose")).default;
      const agg = await Review.aggregate([
        { $match: { revieweeId: new mongoose.Types.ObjectId(req.params.id) } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      ratingSummary = agg[0]
        ? { avg: Number(agg[0].avg.toFixed(2)), count: agg[0].count }
        : { avg: 0, count: 0 };
    }

    res.json({ ...user.toObject(), ratingSummary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
