import { Router } from "express";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Provider updates their profile (categories, location, phone)
router.post("/me", auth(["provider"]), async (req, res) => {
  try {
    const { categories, location, phone } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { categories, location, phone },
      { new: true }
    );
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
