const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const roomRoutes = require("./routes/rooms");
const expenseRoutes = require("./routes/expenses");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// --- CORS ---------------------------------------------------------------
// CLIENT_ORIGIN is a comma-separated list. Entries may contain one "*"
// wildcard (https://*.vercel.app) and trailing slashes are ignored, so a
// copy-pasted "https://my-app.vercel.app/" still matches the browser's Origin.
function buildOriginMatcher(raw) {
  const entries = String(raw || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const matchers = entries.map((entry) => {
    if (entry === "*") return () => true;
    if (!entry.includes("*")) return (origin) => origin === entry;
    const pattern = entry
      .split("*")
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join("[^/]*");
    const regex = new RegExp(`^${pattern}$`);
    return (origin) => regex.test(origin);
  });

  return (origin) => matchers.some((match) => match(origin));
}

function createApp() {
  const app = express();
  const isTest = process.env.NODE_ENV === "test";

  // Render/Vercel/etc. sit behind a proxy; needed for correct client IPs.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  const originAllowed = buildOriginMatcher(process.env.CLIENT_ORIGIN);

  app.use(helmet());
  app.use(
    cors({
      // Requests without an Origin (curl, health checks, server-to-server) are fine.
      origin: (origin, callback) => callback(null, !origin || originAllowed(origin)),
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: "10kb" }));

  // --- Rate limiting (disabled under test) -----------------------------
  const noop = (req, res, next) => next();
  const limiter = (options) =>
    isTest
      ? noop
      : rateLimit({
          standardHeaders: true,
          legacyHeaders: false,
          message: { message: "Too many requests. Please slow down and try again shortly." },
          ...options,
        });

  app.use("/api", limiter({ windowMs: 15 * 60 * 1000, limit: 600 }));
  // Creating/joining rooms is the abusable bit (room-code guessing, spam rooms).
  const roomWriteLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 60 });
  app.use("/api/rooms", (req, res, next) => (req.method === "POST" ? roomWriteLimiter(req, res, next) : next()));

  // --- Routes ----------------------------------------------------------
  app.get("/", (req, res) => res.json({ service: "room-pay-api", status: "ok" }));

  app.get("/api/health", (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      status: dbReady ? "ok" : "degraded",
      service: "room-pay-api",
      database: dbReady ? "connected" : "disconnected",
    });
  });

  app.use("/api/rooms", roomRoutes);
  app.use("/api/expenses", expenseRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
module.exports.buildOriginMatcher = buildOriginMatcher;
