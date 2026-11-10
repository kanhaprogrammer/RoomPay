const test = require("node:test");
const assert = require("node:assert/strict");
const {
  requireString,
  optionalString,
  parseAmount,
  parseExpenseDate,
  parseDateFilter,
  escapeRegex,
  isObjectId,
} = require("../utils/validate");

const status = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.statusCode;
  }
  return null;
};

test("requireString trims and rejects non-strings / blanks / too long", () => {
  assert.equal(requireString("  Kanha ", "Name", { max: 10 }), "Kanha");
  assert.equal(status(() => requireString("   ", "Name")), 400);
  assert.equal(status(() => requireString(undefined, "Name")), 400);
  assert.equal(status(() => requireString({ $ne: null }, "Name")), 400);
  assert.equal(status(() => requireString(["a"], "Name")), 400);
  assert.equal(status(() => requireString("x".repeat(11), "Name", { max: 10 })), 400);
});

test("optionalString allows empty, rejects non-strings", () => {
  assert.equal(optionalString(undefined, "Note"), "");
  assert.equal(optionalString(" hi ", "Note"), "hi");
  assert.equal(status(() => optionalString(5, "Note")), 400);
  assert.equal(status(() => optionalString("x".repeat(201), "Note", { max: 200 })), 400);
});

test("parseAmount accepts numbers/numeric strings and rounds to paise", () => {
  assert.equal(parseAmount(450), 450);
  assert.equal(parseAmount("12.345"), 12.35);
  assert.equal(parseAmount(" 99.5 "), 99.5);
});

test("parseAmount rejects junk", () => {
  for (const bad of [0, -5, "abc", "", null, undefined, NaN, Infinity, "Infinity", 0.001, {}, [], true, 1e12]) {
    assert.equal(status(() => parseAmount(bad)), 400, `should reject ${String(bad)}`);
  }
});

test("parseExpenseDate stores calendar days at UTC midnight", () => {
  assert.equal(parseExpenseDate("2026-11-10").toISOString(), "2026-11-10T00:00:00.000Z");
  assert.equal(parseExpenseDate("2026-11-10T23:30:00+05:30").toISOString(), "2026-11-10T00:00:00.000Z");
  const today = parseExpenseDate(undefined);
  assert.equal(today.getUTCHours(), 0);
});

test("parseExpenseDate rejects impossible / odd dates", () => {
  for (const bad of ["2026-02-31", "2026-13-01", "nope", "1999-01-01", "2101-01-01", 20260101, {}]) {
    assert.equal(status(() => parseExpenseDate(bad)), 400, `should reject ${String(bad)}`);
  }
});

test("parseDateFilter handles end-of-day and invalid input", () => {
  assert.equal(parseDateFilter("2026-01-31", "End", { endOfDay: true }).toISOString(), "2026-01-31T23:59:59.999Z");
  assert.equal(parseDateFilter("2026-01-31", "Start").toISOString(), "2026-01-31T00:00:00.000Z");
  assert.equal(status(() => parseDateFilter("garbage", "Start")), 400);
  assert.equal(status(() => parseDateFilter(["2026-01-01"], "Start")), 400);
});

test("escapeRegex neutralises regex metacharacters", () => {
  const nasty = "(a+)+$[x].*?\\";
  const re = new RegExp(escapeRegex(nasty), "i");
  assert.ok(re.test(`milk ${nasty} tea`));
  assert.doesNotThrow(() => new RegExp(escapeRegex("(")));
  assert.equal(new RegExp(escapeRegex("a.c")).test("abc"), false);
});

test("isObjectId only accepts 24-char hex strings", () => {
  assert.equal(isObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isObjectId("abcdefghijkl"), false);
  assert.equal(isObjectId({ $ne: 1 }), false);
  assert.equal(isObjectId(undefined), false);
});
