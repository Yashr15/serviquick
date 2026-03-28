// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import "./db.js"; // connects to Mongo and logs "✅ MongoDB connected"
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";

// Routers
import authRouter from "./routes/auth.js";
import jobsRouter from "./routes/jobs.js";
import providersRouter from "./routes/providers.js";
import reviewsRouter from "./routes/reviews.js";

const app = express();

// ── Security & utility middleware ────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── CORS ─────────────────────────────────────────────────────────────────────
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : defaultOrigins;
import notificationsRouter from "./routes/notifications.js";

const app = express();

// Build allowed origins from env var (comma-separated) or defaults
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://serviquick-z1234.vercel.app",
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ ok: true, service: "serviquick-api", version: "2.0.0" })
);

app.get("/health", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/providers", providersRouter);
app.use("/api/reviews", reviewsRouter);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
app.use(express.json());

// Simple request logger
app.use((req, _res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check with uptime and environment info
app.get("/", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV || "development" })
);

// Mount routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/jobs", apiLimiter, jobsRouter);
app.use("/api/providers", apiLimiter, providersRouter);
app.use("/api/reviews", apiLimiter, reviewsRouter);
app.use("/api/notifications", apiLimiter, notificationsRouter);

// Global error handler (must be last)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT}`);
});
