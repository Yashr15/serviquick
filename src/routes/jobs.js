import { Router } from "express";
import Job from "../models/Job.js";
import Proposal from "../models/Proposal.js";
import Notification from "../models/Notification.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Helper: create a notification without blocking the response
function notify(userId, type, message, data = {}) {
  Notification.create({ userId, type, message, data }).catch((err) =>
    console.error("Failed to create notification:", err.message)
  );
}

// Create job (requester)
router.post("/", auth(["requester"]), async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    if (!title || !category || !location?.coordinates)
      return res.status(400).json({ error: "Missing fields" });

    const job = await Job.create({
      title,
      description,
      category,
      location,
      requesterId: req.user.id,
    });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List jobs with optional geo + category filters and pagination
router.get("/", auth(["provider", "requester"]), async (req, res) => {
  try {
    const { category, lng, lat, radius = 5, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius) * 1000, // meters
        },
      };
    }

    // $near does not support .skip()/.count() — apply limit only when using geo
    if (lng && lat) {
      const jobs = await Job.find(query).limit(limit);
      return res.json({ jobs, page, limit });
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query),
    ]);
    res.json({ jobs, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Provider claims a job
router.post("/:id/claim", auth(["provider"]), async (req, res) => {
  try {
    const { message = "", bidAmount } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== "open") return res.status(400).json({ error: "Job is no longer open" });

    // Prevent duplicate proposals from the same provider
    const existing = await Proposal.findOne({ jobId: req.params.id, providerId: req.user.id });
    if (existing) return res.status(409).json({ error: "You already submitted a proposal for this job" });

    const proposal = await Proposal.create({
      jobId: req.params.id,
      providerId: req.user.id,
      message,
      bidAmount,
    });

    // Notify the job requester
    notify(job.requesterId, "proposal_received",
      `${req.user.name} submitted a proposal for your job "${job.title}"`,
      { jobId: job._id, proposalId: proposal._id }
    );

    res.json(proposal);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "You already submitted a proposal for this job" });
    res.status(500).json({ error: e.message });
  }
});

// Requester accepts a specific proposal for a job
router.post("/:id/accept", auth(["requester"]), async (req, res) => {
  try {
    const { proposalId } = req.body;
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.requesterId) !== req.user.id)
      return res.status(403).json({ error: "Not your job" });

    job.status = "assigned";
    job.assignedProviderId = proposal.providerId;
    job.acceptedProposalId = proposal._id;
    await job.save();
    proposal.status = "accepted";
    await proposal.save();

    const rejectedProposals = await Proposal.find(
      { jobId: job._id, _id: { $ne: proposal._id } },
      { providerId: 1 }
    );

    await Proposal.updateMany(
      { jobId: job._id, _id: { $ne: proposal._id } },
      { $set: { status: "rejected" } }
    );

    // Notify accepted provider
    notify(proposal.providerId, "proposal_accepted",
      `Your proposal for "${job.title}" was accepted!`,
      { jobId: job._id, proposalId: proposal._id }
    );

    // Notify rejected providers
    rejectedProposals.forEach((p) => {
      notify(p.providerId, "proposal_rejected",
        `Your proposal for "${job.title}" was not selected.`,
        { jobId: job._id }
      );
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all proposals for a job (requester/provider can see)
router.get("/:id/proposals", auth(["requester", "provider"]), async (req, res) => {
  try {
    const props = await Proposal.find({ jobId: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(props);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// My jobs (requester)
router.get("/me/requester", auth(["requester"]), async (req, res) => {
  try {
    const jobs = await Job.find({ requesterId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// My bids (provider)
router.get("/me/provider", auth(["provider"]), async (req, res) => {
  try {
    const proposals = await Proposal.find({ providerId: req.user.id })
      .populate("jobId")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Requester marks job complete; mock payment based on accepted proposal
router.post("/:id/complete", auth(["requester"]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.requesterId) !== req.user.id) return res.status(403).json({ error: "Not your job" });
    if (job.status !== "assigned") return res.status(400).json({ error: "Job not in assigned state" });

    const accepted = await Proposal.findById(job.acceptedProposalId);
    const amount = Number(accepted?.bidAmount || 0);

    job.status = "completed";
    job.completedAt = new Date();
    job.payment = {
      amount,
      currency: "INR",
      status: "paid",     // 💳 mock
      paidAt: new Date()
    };
    await job.save();

    // Notify the assigned provider
    if (job.assignedProviderId) {
      notify(job.assignedProviderId, "job_completed",
        `The job "${job.title}" has been marked complete. Payment of ₹${amount} recorded.`,
        { jobId: job._id, amount }
      );
    }

    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete an open job (requester only, only if status is "open")
router.delete("/:id", auth(["requester"]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.requesterId) !== req.user.id) return res.status(403).json({ error: "Not your job" });
    if (job.status !== "open") return res.status(400).json({ error: "Only open jobs can be deleted" });

    await job.deleteOne();
    // Remove associated proposals
    await Proposal.deleteMany({ jobId: job._id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
