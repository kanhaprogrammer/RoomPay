// End-to-end API tests against a real MongoDB.
//
//   npm test                                  -> uses an in-memory MongoDB (downloaded once)
//   MONGODB_TEST_URI=mongodb://127.0.0.1:27017 npm test
//                                             -> uses your own server; a throw-away
//                                                database is created and dropped.
process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");

const connectDB = require("../config/db");
const app = require("../app");
const Member = require("../models/Member");
const Room = require("../models/Room");
const Expense = require("../models/Expense");

let memoryServer;

test.before(async () => {
  let uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  const dbName = `roompay_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await connectDB(uri, { dbName });
  // Make sure the unique/partial indexes exist before we rely on them.
  await Promise.all([Room.init(), Member.init(), Expense.init()]);
});

test.after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (memoryServer) await memoryServer.stop();
});

const api = () => request(app);

async function makeRoom(roomName = "Flat 204", name = "Kanha") {
  const res = await api().post("/api/rooms").send({ roomName, name }).expect(201);
  return { code: res.body.room.roomCode, creator: res.body.member };
}

test("health check reports database state", async () => {
  const res = await api().get("/api/health").expect(200);
  assert.equal(res.body.database, "connected");
});

test("create room: validates input", async () => {
  await api().post("/api/rooms").send({}).expect(400);
  await api().post("/api/rooms").send({ roomName: "A", name: "   " }).expect(400);
  await api().post("/api/rooms").send({ roomName: { $ne: 1 }, name: "x" }).expect(400);
  await api().post("/api/rooms").send({ roomName: "x".repeat(61), name: "x" }).expect(400);
  await api().post("/api/rooms").set("Content-Type", "application/json").send("{bad json").expect(400);
});

test("create room + overview", async () => {
  const { code, creator } = await makeRoom("  Boys PG ", " Kanha ");
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.equal(creator.isCreator, true);

  const res = await api().get(`/api/rooms/${code.toLowerCase()}`).expect(200);
  assert.equal(res.body.room.roomName, "Boys PG");
  assert.equal(res.body.stats.memberCount, 1);
  assert.equal(res.body.stats.totalExpense, 0);
  assert.equal(res.body.stats.expenseCount, 0);
  assert.equal(res.body.stats.equalShare, 0);
  assert.equal(res.body.stats.members[0].name, "Kanha");
});

test("unknown room -> 404, junk room code types -> 4xx not 500", async () => {
  await api().get("/api/rooms/ZZZZZZ").expect(404);
  await api().post("/api/rooms/join").send({ roomCode: { $ne: null }, name: "x" }).expect(400);
  await api().post("/api/expenses").send({ roomCode: ["A"], item: "x", amount: 1 }).expect(400);
});

test("join: new member, case-insensitive rejoin returns the same member", async () => {
  const { code } = await makeRoom();
  const a = await api().post("/api/rooms/join").send({ roomCode: code, name: "Rahul" }).expect(200);
  const b = await api().post("/api/rooms/join").send({ roomCode: code.toLowerCase(), name: "rahul" }).expect(200);
  assert.equal(a.body.member.id, b.body.member.id);
  const overview = await api().get(`/api/rooms/${code}`).expect(200);
  assert.equal(overview.body.stats.memberCount, 2);
});

test("join: simultaneous joins with the same name create one member", async () => {
  const { code } = await makeRoom();
  const results = await Promise.all(
    Array.from({ length: 6 }, () => api().post("/api/rooms/join").send({ roomCode: code, name: "Sam" }))
  );
  results.forEach((r) => assert.equal(r.status, 200));
  assert.equal(new Set(results.map((r) => r.body.member.id)).size, 1);
  const members = await api().get(`/api/rooms/${code}/members`).expect(200);
  assert.equal(members.body.members.filter((m) => m.name === "Sam").length, 1);
});

test("expenses: add, validate, totals and equal share", async () => {
  const { code } = await makeRoom();
  await api().post("/api/rooms/join").send({ roomCode: code, name: "Rahul" }).expect(200);

  await api().post("/api/expenses").send({ roomCode: code, item: "Milk", amount: 100.1, date: "2026-11-01" }).expect(201);
  await api().post("/api/expenses").send({ roomCode: code, item: "Gas", amount: "200.2", date: "2026-11-02" }).expect(201);

  for (const bad of [
    { item: "", amount: 5 },
    { item: "x", amount: 0 },
    { item: "x", amount: -1 },
    { item: "x", amount: "abc" },
    { item: "x", amount: "Infinity" },
    { item: "x", amount: 5, date: "2026-02-31" },
    { item: "x".repeat(61), amount: 5 },
    { item: "x", amount: 5, note: "n".repeat(201) },
  ]) {
    const res = await api().post("/api/expenses").send({ roomCode: code, ...bad });
    assert.equal(res.status, 400, JSON.stringify(bad));
    assert.ok(res.body.message);
  }
  await api().post("/api/expenses").send({ roomCode: "NOPE99", item: "x", amount: 5 }).expect(404);

  const res = await api().get(`/api/rooms/${code}`).expect(200);
  assert.equal(res.body.stats.totalExpense, 300.3);
  assert.equal(res.body.stats.expenseCount, 2);
  assert.equal(res.body.stats.equalShare, 150.15);
  assert.equal(res.body.stats.recentExpenses[0].item, "Gas");
});

test("expenses: dates are stored as the chosen calendar day", async () => {
  const { code } = await makeRoom();
  const res = await api().post("/api/expenses").send({ roomCode: code, item: "Rent", amount: 5000, date: "2026-11-10" }).expect(201);
  assert.equal(res.body.expense.date, "2026-11-10T00:00:00.000Z");
});

test("expenses: search is regex-safe, sorting and date filters work", async () => {
  const { code } = await makeRoom();
  const add = (item, amount, date) => api().post("/api/expenses").send({ roomCode: code, item, amount, date }).expect(201);
  await add("Milk (2L)", 120, "2026-01-05");
  await add("Rice", 80, "2026-01-31");
  await add("Wi-Fi", 999, "2026-02-01");

  const q = (params) => api().get(`/api/expenses/${code}`).query(params);

  assert.equal((await q({ search: "(" }).expect(200)).body.expenses.length, 1); // would 500 unescaped
  assert.equal((await q({ search: ".*" }).expect(200)).body.expenses.length, 0);
  assert.equal((await q({ search: "milk" }).expect(200)).body.expenses.length, 1);
  assert.deepEqual((await q({ sort: "highest" })).body.expenses.map((e) => e.amount), [999, 120, 80]);
  assert.deepEqual((await q({ sort: "lowest" })).body.expenses.map((e) => e.amount), [80, 120, 999]);
  assert.deepEqual((await q({ sort: "oldest" })).body.expenses.map((e) => e.item), ["Milk (2L)", "Rice", "Wi-Fi"]);
  assert.equal((await q({ sort: "bogus" }).expect(200)).body.expenses.length, 3);

  // dateTo is inclusive of the whole day
  const jan = await q({ dateFrom: "2026-01-01", dateTo: "2026-01-31" }).expect(200);
  assert.equal(jan.body.expenses.length, 2);
  await q({ dateFrom: "garbage" }).expect(400);

  const recent = await api().get(`/api/expenses/${code}/recent?limit=2`).expect(200);
  assert.equal(recent.body.expenses.length, 2);
  const capped = await api().get(`/api/expenses/${code}/recent?limit=999`).expect(200);
  assert.equal(capped.body.expenses.length, 3);
});

test("leave: member disappears; creator leaving transfers ownership", async () => {
  const { code, creator } = await makeRoom();
  const rahul = (await api().post("/api/rooms/join").send({ roomCode: code, name: "Rahul" })).body.member;
  const sam = (await api().post("/api/rooms/join").send({ roomCode: code, name: "Sam" })).body.member;

  await api().delete(`/api/rooms/${code}/members/not-an-id`).expect(400);
  await api().delete(`/api/rooms/${code}/members/${creator.id}`).expect(200);

  const members = (await api().get(`/api/rooms/${code}/members`).expect(200)).body.members;
  assert.deepEqual(members.map((m) => m.name), ["Rahul", "Sam"]);
  assert.equal(members.find((m) => m.id === rahul.id).isCreator, true);
  assert.equal(members.find((m) => m.id === sam.id).isCreator, false);

  // leaving twice -> 404
  await api().delete(`/api/rooms/${code}/members/${creator.id}`).expect(404);
  // the name is free again
  await api().post("/api/rooms/join").send({ roomCode: code, name: "Kanha" }).expect(200);
});

test("last member leaving archives the room", async () => {
  const { code, creator } = await makeRoom();
  await api().delete(`/api/rooms/${code}/members/${creator.id}`).expect(200);
  await api().get(`/api/rooms/${code}`).expect(404);
  await api().post("/api/rooms/join").send({ roomCode: code, name: "Late" }).expect(404);
});

test("kick: only the creator, never yourself, never outsiders", async () => {
  const { code, creator } = await makeRoom();
  const rahul = (await api().post("/api/rooms/join").send({ roomCode: code, name: "Rahul" })).body.member;
  const other = await makeRoom("Other", "Mallory");

  const kick = (target, requesterId) =>
    api().post(`/api/rooms/${code}/members/${target}/kick`).send({ requesterId });

  assert.equal((await kick(creator.id, rahul.id)).status, 403); // non-creator
  assert.equal((await kick(rahul.id, other.creator.id)).status, 403); // creator of another room
  assert.equal((await kick(creator.id, creator.id)).status, 400); // self
  assert.equal((await kick(rahul.id, "junk")).status, 400);
  assert.equal((await kick("507f1f77bcf86cd799439011", creator.id)).status, 404);

  const ok = await kick(rahul.id, creator.id);
  assert.equal(ok.status, 200);
  const members = (await api().get(`/api/rooms/${code}/members`)).body.members;
  assert.deepEqual(members.map((m) => m.name), ["Kanha"]);
});

test("unknown API route -> JSON 404", async () => {
  const res = await api().get("/api/nope").expect(404);
  assert.match(res.body.message, /not found/i);
});
