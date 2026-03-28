import rateLimit from "express-rate-limit";

// Strict limiter for auth/mutation endpoints (100 req / 15 min per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Tighter limiter for password/auth endpoints (20 req / 15 min per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later." },
});
