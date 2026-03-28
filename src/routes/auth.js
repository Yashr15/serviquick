import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, categories = [], location, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, categories, location, phone });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user profile
router.get("/me", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update current user profile (name, phone, categories, location)
router.put("/me", auth(), async (req, res) => {
  try {
    const { name, phone, categories, location } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (categories !== undefined) update.categories = categories;
    if (location) update.location = location;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("-passwordHash");
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Change password
router.put("/me/password", auth(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Authentication failed" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
