import { Router } from "express";
import Job from "../models/Job.js";
import Proposal from "../models/Proposal.js";
import { auth } from "../middleware/auth.js";

const router = Router();

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

// List jobs with optional geo + category filters
router.get("/", auth(["provider", "requester"]), async (req, res) => {
  try {
    const { category, lng, lat, radius = 5 } = req.query; // radius in km
    const query = {};
    if (category) query.category = category;

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

    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Provider claims a job
router.post("/:id/claim", auth(["provider"]), async (req, res) => {
  try {
    const { message = "", bidAmount } = req.body;
    const proposal = await Proposal.create({
      jobId: req.params.id,
      providerId: req.user.id,
      message,
      bidAmount,
    });
    res.json(proposal);
  } catch (e) {
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

    await Proposal.updateMany(
      { jobId: job._id, _id: { $ne: proposal._id } },
      { $set: { status: "rejected" } }
    );

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

    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




export default router; // ✅ export ONLY at the end
