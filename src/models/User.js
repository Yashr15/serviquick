import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["requester","provider"], required: true },
  categories: { type: [String], default: [] }, // for providers
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [77.209, 28.6139] } // [lng,lat]
  },
  phone: String
}, { timestamps: true });

UserSchema.index({ location: "2dsphere" });

export default mongoose.model("User", UserSchema);
