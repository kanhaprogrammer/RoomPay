const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

// Throws (instead of exiting the process) so callers - the server and the
// test-suite - decide what to do when the database is unreachable.
async function connectDB(uri = process.env.MONGODB_URI, extraOptions = {}) {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in."
    );
  }

  const options = { serverSelectionTimeoutMS: 15000, ...extraOptions };
  if (process.env.MONGODB_DB && !options.dbName) options.dbName = process.env.MONGODB_DB;

  await mongoose.connect(uri, options);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"));
  return mongoose.connection;
}

module.exports = connectDB;
