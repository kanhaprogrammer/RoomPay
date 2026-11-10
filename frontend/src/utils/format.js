export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// Expense dates are calendar days stored as midnight UTC, so they must be
// formatted in UTC - otherwise viewers west of UTC would see the day before.
export function formatDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

// For real moments in time (e.g. when someone joined) - shown in local time.
export function formatDateLong(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Value for <input type="date">: today's date in the user's own timezone.
export function toInputDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[1])[0]).toUpperCase();
}
