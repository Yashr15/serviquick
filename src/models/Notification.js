import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["proposal_received", "proposal_accepted", "proposal_rejected", "job_completed", "review_received"],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index to efficiently fetch unread notifications for a user
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", NotificationSchema);
