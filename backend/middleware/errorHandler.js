// Small helper so route handlers can be plain async functions without a
// try/catch in every single one - any rejected promise is forwarded to
// the error handler below.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// A predictable error shape controllers can throw to control the
// status code returned to the client.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // If a response is already in flight, let Express close the connection.
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong. Please try again.";

  // Bad / oversized JSON bodies (body-parser)
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body must be valid JSON.";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID provided.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
  }

  // Duplicate key error - say the right thing for the right index.
  if (err.code === 11000) {
    statusCode = 409;
    message =
      err.keyPattern && err.keyPattern.roomCode
        ? "Could not generate a unique room code. Please try again."
        : "That name is already used in this room. Try a different name.";
  }

  if (statusCode >= 500) {
    // Never leak raw server/database errors to the client.
    console.error(err);
    statusCode = 500;
    message = "Something went wrong. Please try again.";
  }

  res.status(statusCode).json({ message });
}

module.exports = { asyncHandler, ApiError, notFound, errorHandler };
