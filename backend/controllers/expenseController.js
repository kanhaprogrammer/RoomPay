const Room = require("../models/Room");
const Expense = require("../models/Expense");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const {
  requireString,
  optionalString,
  parseAmount,
  parseExpenseDate,
  parseDateFilter,
  escapeRegex,
} = require("../utils/validate");

async function findActiveRoom(roomCodeInput) {
  const roomCode = requireString(roomCodeInput, "Room code", { max: 20 }).toUpperCase();
  const room = await Room.findOne({ roomCode, isActive: true });
  if (!room) throw new ApiError(404, "Room not found. Please check the room code.");
  return room;
}

// _id is always the final tie-breaker so ordering is stable between requests.
const SORT_OPTIONS = {
  newest: { date: -1, createdAt: -1, _id: -1 },
  oldest: { date: 1, createdAt: 1, _id: 1 },
  highest: { amount: -1, date: -1, _id: -1 },
  lowest: { amount: 1, date: -1, _id: -1 },
};

// POST /api/expenses
const addExpense = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const room = await findActiveRoom(body.roomCode);
  const item = requireString(body.item, "Expense name", { max: 60 });
  const amount = parseAmount(body.amount);
  const date = parseExpenseDate(body.date);
  const note = optionalString(body.note, "Note", { max: 200 });

  const expense = await Expense.create({ room: room._id, item, amount, date, note });

  res.status(201).json({ expense });
});

// GET /api/expenses/:roomCode
const listExpenses = asyncHandler(async (req, res) => {
  const room = await findActiveRoom(req.params.roomCode);
  const { search, dateFrom, dateTo, sort } = req.query;

  const query = { room: room._id };

  if (typeof search === "string" && search.trim()) {
    query.item = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" };
  }

  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = parseDateFilter(dateFrom, "Start date");
    if (dateTo) query.date.$lte = parseDateFilter(dateTo, "End date", { endOfDay: true });
  }

  const sortSpec = (typeof sort === "string" && SORT_OPTIONS[sort]) || SORT_OPTIONS.newest;

  const expenses = await Expense.find(query).sort(sortSpec);

  res.json({ expenses });
});

// GET /api/expenses/:roomCode/recent
const getRecentExpenses = asyncHandler(async (req, res) => {
  const room = await findActiveRoom(req.params.roomCode);
  const parsed = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 5;

  const expenses = await Expense.find({ room: room._id })
    .sort(SORT_OPTIONS.newest)
    .limit(limit);

  res.json({ expenses });
});

module.exports = { addExpense, listExpenses, getRecentExpenses };
