// src/db.js
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ Missing MONGODB_URI in environment. Create .env in project root.");
  process.exit(1);
}

// ── Connection options ───────────────────────────────────────────────────────
// serverSelectionTimeoutMS – how long to wait when picking a server (container
//   startup or transient network blip).
// socketTimeoutMS          – how long an idle socket stays open.
// connectTimeoutMS         – TCP-level connection timeout.
// maxPoolSize              – max simultaneous connections from this process.
// minPoolSize              – pre-warmed connections kept alive at all times.
// heartbeatFrequencyMS     – how often the driver pings the server.
// retryWrites / retryReads – automatically retry once on transient failures
//   (e.g. primary failover).
const connectionOptions = {
  dbName: "serviquick",
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  maxPoolSize: 10,
  minPoolSize: 2,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  retryReads: true,
};

// ── Retry helper ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(uri, connectionOptions);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    console.error("❌ Could not connect to MongoDB after maximum retries. Exiting.");
    process.exit(1);
  }
}

// ── Lifecycle events ──────────────────────────────────────────────────────────
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Mongoose will attempt to reconnect automatically.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err.message);
});

// Graceful shutdown – close the connection when the process exits.
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received – closing MongoDB connection…`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

await connectWithRetry();

export default mongoose;
