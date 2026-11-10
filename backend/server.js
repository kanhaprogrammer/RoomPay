require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Room Pay API running on port ${PORT}`);
  });

  // Render / Docker send SIGTERM on deploys - finish in-flight requests first.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

start().catch((err) => {
  console.error("Failed to start Room Pay API:", err.message);
  process.exit(1);
});
