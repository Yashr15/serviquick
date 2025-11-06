// src/models/Review.js
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", index: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // requester
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // provider
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// prevent duplicate review per job by same reviewer
ReviewSchema.index({ jobId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);
