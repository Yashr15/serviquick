// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db.js"; // connects to Mongo and logs "✅ MongoDB connected"

// Routers
import authRouter from "./routes/auth.js";
import jobsRouter from "./routes/jobs.js";
import providersRouter from "./routes/providers.js";
import reviewsRouter from "./routes/reviews.js"; // <-- new

const app = express();

// Middleware
const allowed = process.env.CORS_ORIGIN?.split(",") ?? [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://serviquick.vercel.app",
];

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://serviquick.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());

// Health
app.get("/", (_req, res) => res.json({ ok: true }));

// Mount routes (MUST be after app is created)
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/providers", providersRouter);
app.use("/api/reviews", reviewsRouter); // <-- here is fine now

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT}`);
});
