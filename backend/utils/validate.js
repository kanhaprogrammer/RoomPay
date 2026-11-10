const { ApiError } = require("../middleware/errorHandler");

const MAX_AMOUNT = 10000000; // ₹1 crore - guards against typos like 1e12
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID = /^[a-f\d]{24}$/i;

function isObjectId(value) {
  return typeof value === "string" && OBJECT_ID.test(value);
}

// Required, trimmed string. Rejects non-strings (arrays/objects sent in JSON)
// so they can never reach a Mongo query or a .trim() call.
function requireString(value, label, { max } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${label} is required.`);
  }
  const trimmed = value.trim();
  if (max && trimmed.length > max) {
    throw new ApiError(400, `${label} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

function optionalString(value, label, { max } = {}) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") throw new ApiError(400, `${label} must be text.`);
  const trimmed = value.trim();
  if (max && trimmed.length > max) {
    throw new ApiError(400, `${label} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

// Accepts a number or numeric string, rounds to paise, rejects NaN/Infinity,
// zero, negatives and absurdly large values.
function parseAmount(value) {
  let n = NaN;
  if (typeof value === "number") n = value;
  else if (typeof value === "string" && value.trim() !== "") n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    throw new ApiError(400, "Please enter a valid expense amount.");
  }
  const rounded = Math.round(n * 100) / 100;
  if (rounded < 0.01) throw new ApiError(400, "Please enter a valid expense amount.");
  if (rounded > MAX_AMOUNT) {
    throw new ApiError(400, "That amount is too large. Please double-check it.");
  }
  return rounded;
}

function isValidCalendarDate(d, expectedIso) {
  if (Number.isNaN(d.getTime())) return false;
  const year = d.getUTCFullYear();
  if (year < 2000 || year > 2100) return false;
  return expectedIso ? d.toISOString().slice(0, 10) === expectedIso : true;
}

// Expense dates are calendar days, not moments in time. They are always stored
// as midnight UTC of that day so they display as the same day for every
// viewer, whatever their timezone.
function parseExpenseDate(value) {
  if (value === undefined || value === null || value === "") {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (typeof value !== "string") throw new ApiError(400, "Please enter a valid date.");

  if (DATE_ONLY.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`);
    // The round-trip check rejects impossible dates such as 2026-02-31.
    if (!isValidCalendarDate(d, value)) throw new ApiError(400, "Please enter a valid date.");
    return d;
  }

  const d = new Date(value);
  if (!isValidCalendarDate(d)) throw new ApiError(400, "Please enter a valid date.");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Used for the optional dateFrom / dateTo list filters.
function parseDateFilter(value, label, { endOfDay = false } = {}) {
  if (typeof value !== "string") throw new ApiError(400, `${label} is not a valid date.`);
  if (DATE_ONLY.test(value)) {
    const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    if (!isValidCalendarDate(d)) throw new ApiError(400, `${label} is not a valid date.`);
    return d;
  }
  const d = new Date(value);
  if (!isValidCalendarDate(d)) throw new ApiError(400, `${label} is not a valid date.`);
  return d;
}

// Search text is user input - escape it so "(" or "*" can't produce an invalid
// (500) or catastrophic (ReDoS) regular expression.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  MAX_AMOUNT,
  isObjectId,
  requireString,
  optionalString,
  parseAmount,
  parseExpenseDate,
  parseDateFilter,
  escapeRegex,
};
