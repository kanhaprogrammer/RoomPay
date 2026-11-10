import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, formatDate, getInitials, toInputDate } from "./format.js";

describe("formatCurrency", () => {
  it("formats whole and fractional rupees", () => {
    assert.equal(formatCurrency(450), "₹450");
    assert.equal(formatCurrency(1234567), "₹12,34,567");
    assert.equal(formatCurrency(99.5), "₹99.50");
  });
  it("is safe with bad input", () => {
    assert.equal(formatCurrency(undefined), "₹0");
    assert.equal(formatCurrency("abc"), "₹0");
  });
});

describe("formatDate", () => {
  it("shows the stored calendar day regardless of timezone", () => {
    assert.match(formatDate("2026-11-10T00:00:00.000Z"), /10/);
    assert.match(formatDate("2026-11-10T00:00:00.000Z"), /Nov/);
  });
  it("returns empty string for invalid dates", () => {
    assert.equal(formatDate("nope"), "");
  });
});

describe("getInitials", () => {
  it("handles one, two and zero words", () => {
    assert.equal(getInitials("kanha"), "KA");
    assert.equal(getInitials("Kanha Sharma"), "KS");
    assert.equal(getInitials(""), "?");
    assert.equal(getInitials("   "), "?");
  });
});

describe("toInputDate", () => {
  it("returns YYYY-MM-DD", () => {
    assert.match(toInputDate(new Date()), /^\d{4}-\d{2}-\d{2}$/);
  });
});
