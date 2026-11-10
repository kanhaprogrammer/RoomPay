const test = require("node:test");
const assert = require("node:assert/strict");
const generateRoomCode = require("../utils/generateRoomCode");
const { buildOriginMatcher } = require("../app");
const { errorHandler } = require("../middleware/errorHandler");

test("room codes are 6 chars from the unambiguous alphabet", () => {
  for (let i = 0; i < 500; i++) {
    const code = generateRoomCode();
    assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  }
});

test("room codes are well distributed (no collisions in 2000 draws is overwhelmingly likely)", () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(generateRoomCode());
  assert.ok(seen.size > 1990);
});

test("CORS matcher: exact, trailing slash, wildcard, and rejection", () => {
  const ok = buildOriginMatcher("https://room-pay.vercel.app/, https://*.vercel.app ,http://localhost:5173");
  assert.equal(ok("https://room-pay.vercel.app"), true);
  assert.equal(ok("https://room-pay-git-main-me.vercel.app"), true);
  assert.equal(ok("http://localhost:5173"), true);
  assert.equal(ok("https://evil.example.com"), false);
  assert.equal(ok("https://vercel.app.evil.com"), false);
  assert.equal(ok("http://localhost:3000"), false);
  assert.equal(buildOriginMatcher("*")("https://anything.dev"), true);
  assert.equal(buildOriginMatcher(undefined)("http://localhost:5173"), true);
});

function run(err) {
  const res = {
    headersSent: false,
    code: null,
    body: null,
    status(c) {
      this.code = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
  const origError = console.error;
  console.error = () => {};
  errorHandler(err, {}, res, () => {});
  console.error = origError;
  return res;
}

test("errorHandler maps known errors and hides 500 internals", () => {
  assert.equal(run(Object.assign(new Error("x"), { name: "CastError" })).code, 400);
  assert.equal(run(Object.assign(new Error("x"), { code: 11000, keyPattern: { name: 1 } })).code, 409);
  assert.match(
    run(Object.assign(new Error("x"), { code: 11000, keyPattern: { roomCode: 1 } })).body.message,
    /room code/i
  );
  assert.equal(run(Object.assign(new Error("bad"), { type: "entity.parse.failed", status: 400 })).body.message, "Request body must be valid JSON.");
  const boom = run(new Error("mongo://user:pass@host exploded"));
  assert.equal(boom.code, 500);
  assert.ok(!JSON.stringify(boom.body).includes("pass"));
});
