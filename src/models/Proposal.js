import mongoose from "mongoose";

const ProposalSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: String,
  bidAmount: Number,
  status: { type: String, enum: ["pending","accepted","rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Proposal", ProposalSchema);
