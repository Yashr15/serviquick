import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["requester", "provider"], required: true },
  categories: { type: [String], default: [] }, // for providers
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [77.209, 28.6139] }, // [lng, lat]
  },
  phone: { type: String, default: "" },
  bio: { type: String, default: "", maxlength: 500 },
  avatar: { type: String, default: "" }, // URL to avatar image
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ role: 1, categories: 1 });

export default mongoose.model("User", UserSchema);
