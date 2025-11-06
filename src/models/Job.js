import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: { type: String, index: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    status: { type: String, enum: ["open", "assigned", "completed"], default: "open", index: true },
    assignedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedProposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },
    payment: {
      amount: Number,
      currency: { type: String, default: "INR" },
      status: { type: String, enum: ["pending", "paid"], default: "pending" },
      paidAt: Date,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

// 🔑 add the geo index
JobSchema.index({ location: "2dsphere" });

export default mongoose.model("Job", JobSchema);
