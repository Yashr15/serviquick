// src/db.js
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ Missing MONGODB_URI in environment. Create .env in project root.");
  process.exit(1);
}

mongoose
  .connect(uri, { dbName: "serviquick" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

export default mongoose;
