import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, index: true, required: true },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    tags: { type: [String], default: [] },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled"],
      default: "open",
      index: true,
    },
    assignedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedProposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },
    payment: {
      amount: Number,
      currency: { type: String, default: "INR" },
      status: { type: String, enum: ["pending", "paid"], default: "pending" },
      paidAt: Date,
    },
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

JobSchema.index({ location: "2dsphere" });
JobSchema.index({ title: "text", description: "text" });

export default mongoose.model("Job", JobSchema);
