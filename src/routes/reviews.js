// src/routes/reviews.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Job from "../models/Job.js";
import Review from "../models/Review.js";

const router = Router();

// Create a review for a completed job (requester -> provider)
router.post("/", auth(["requester"]), async (req, res) => {
  try {
    const { jobId, rating, comment = "" } = req.body;
    if (!jobId || !rating) return res.status(400).json({ error: "jobId and rating required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.requesterId) !== req.user.id) return res.status(403).json({ error: "Not your job" });
    if (job.status !== "completed") return res.status(400).json({ error: "Job not completed" });
    if (!job.assignedProviderId) return res.status(400).json({ error: "No provider assigned" });

    const review = await Review.create({
      jobId,
      reviewerId: req.user.id,
      revieweeId: job.assignedProviderId,
      rating: Number(rating),
      comment
    });

    res.json(review);
  } catch (e) {
    // handle duplicate review gracefully
    if (e?.code === 11000) return res.status(400).json({ error: "Review already submitted" });
    res.status(500).json({ error: e.message });
  }
});

// Provider rating summary
router.get("/provider/:id", async (req, res) => {
  const providerId = req.params.id;
  const agg = await Review.aggregate([
    { $match: { revieweeId: new (await import("mongoose")).default.Types.ObjectId(providerId) } },
    { $group: { _id: "$revieweeId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  const summary = agg[0] ? { avg: Number(agg[0].avg.toFixed(2)), count: agg[0].count } : { avg: 0, count: 0 };
  res.json(summary);
});

// All reviews for a provider (optional)
router.get("/provider/:id/list", async (req, res) => {
  const providerId = req.params.id;
  const list = await Review.find({ revieweeId: providerId }).sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

export default router;
