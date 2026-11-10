const Room = require("../models/Room");
const Member = require("../models/Member");
const Expense = require("../models/Expense");
const generateRoomCode = require("../utils/generateRoomCode");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { requireString, isObjectId } = require("../utils/validate");

const NEWEST = { date: -1, createdAt: -1, _id: -1 };

const round2 = (n) => Math.round(n * 100) / 100;

function serializeMember(member) {
  return {
    id: member._id,
    name: member.name,
    isCreator: member.isCreator,
    joinedAt: member.createdAt,
  };
}

async function findActiveRoomByCode(roomCodeInput) {
  const roomCode = requireString(roomCodeInput, "Room code", { max: 20 }).toUpperCase();
  const room = await Room.findOne({ roomCode, isActive: true });
  if (!room) throw new ApiError(404, "Room not found. Please check the room code.");
  return room;
}

// Builds the summary numbers for a room. Expenses are shared/logged, not
// attributed to a specific payer, so stats here are room-wide totals rather
// than a per-member breakdown. Totals are computed inside MongoDB instead of
// loading every expense into memory.
async function buildRoomStats(roomId) {
  const [members, totals, recentExpenses] = await Promise.all([
    Member.find({ room: roomId, isActive: true }).sort({ createdAt: 1, _id: 1 }),
    Expense.aggregate([
      { $match: { room: roomId } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.find({ room: roomId }).sort(NEWEST).limit(5),
  ]);

  const totalExpense = totals.length ? totals[0].total : 0;
  const expenseCount = totals.length ? totals[0].count : 0;
  const memberCount = members.length;
  const equalShare = memberCount > 0 ? totalExpense / memberCount : 0;

  return {
    totalExpense: round2(totalExpense),
    memberCount,
    expenseCount,
    equalShare: round2(equalShare),
    members: members.map(serializeMember),
    recentExpenses,
  };
}

// Creates the room, retrying with a fresh code if two rooms ever race for the
// same one (the unique index is the source of truth, not a pre-check).
async function createRoomWithUniqueCode(roomName) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await Room.create({ roomName, roomCode: generateRoomCode() });
    } catch (err) {
      const isCodeCollision = err && err.code === 11000 && err.keyPattern && err.keyPattern.roomCode;
      if (!isCodeCollision) throw err;
    }
  }
  throw new ApiError(500, "Could not generate a room code. Please try again.");
}

// POST /api/rooms
const createRoom = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const roomName = requireString(body.roomName, "Room name", { max: 60 });
  const name = requireString(body.name, "Your name", { max: 40 });

  const room = await createRoomWithUniqueCode(roomName);

  let creator;
  try {
    creator = await Member.create({ name, room: room._id, isCreator: true });
    room.createdBy = creator._id;
    await room.save();
  } catch (err) {
    // Don't leave a half-created room behind.
    await Member.deleteMany({ room: room._id });
    await Room.deleteOne({ _id: room._id });
    throw err;
  }

  res.status(201).json({
    room: { id: room._id, roomName: room.roomName, roomCode: room.roomCode },
    member: { id: creator._id, name: creator.name, isCreator: true },
  });
});

const NAME_COLLATION = { locale: "en", strength: 2 };

// POST /api/rooms/join
const joinRoom = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const room = await findActiveRoomByCode(body.roomCode);
  const name = requireString(body.name, "Your name", { max: 40 });

  const findExisting = () =>
    Member.findOne({ room: room._id, name, isActive: true }).collation(NAME_COLLATION);

  // Joining with an existing name signs you back in as that member (this is
  // how someone continues on a new phone). Otherwise a new member is created.
  let member = await findExisting();
  if (!member) {
    try {
      member = await Member.create({ name, room: room._id });
    } catch (err) {
      // Two simultaneous joins with the same name: the loser reuses the winner.
      if (err && err.code === 11000) member = await findExisting();
      if (!member) throw err;
    }
  }

  res.status(200).json({
    room: { id: room._id, roomName: room.roomName, roomCode: room.roomCode },
    member: { id: member._id, name: member.name, isCreator: member.isCreator },
  });
});

// GET /api/rooms/:roomCode
const getRoomOverview = asyncHandler(async (req, res) => {
  const room = await findActiveRoomByCode(req.params.roomCode);
  const stats = await buildRoomStats(room._id);

  res.json({
    room: { id: room._id, roomName: room.roomName, roomCode: room.roomCode, createdAt: room.createdAt },
    stats,
  });
});

// GET /api/rooms/:roomCode/members
const getMembers = asyncHandler(async (req, res) => {
  const room = await findActiveRoomByCode(req.params.roomCode);
  const members = await Member.find({ room: room._id, isActive: true }).sort({ createdAt: 1, _id: 1 });
  res.json({ members: members.map(serializeMember) });
});

// Shared cleanup after a member becomes inactive: transfer ownership to the
// next-earliest-joined remaining member, or archive the room if it's now
// empty.
async function handleMemberDeparture(room, departingMember) {
  const remaining = await Member.find({ room: room._id, isActive: true }).sort({ createdAt: 1, _id: 1 });

  if (remaining.length === 0) {
    room.isActive = false;
    await room.save();
    return;
  }

  const hasCreator = remaining.some((m) => m.isCreator);
  if (departingMember.isCreator || !hasCreator) {
    // Ownership passes to whoever joined next earliest after the creator.
    const next = remaining[0];
    next.isCreator = true;
    await next.save();
    room.createdBy = next._id;
    await room.save();
  }
}

// DELETE /api/rooms/:roomCode/members/:memberId
const leaveRoom = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  if (!isObjectId(memberId)) throw new ApiError(400, "Invalid member.");

  const room = await findActiveRoomByCode(req.params.roomCode);

  const member = await Member.findOne({ _id: memberId, room: room._id, isActive: true });
  if (!member) throw new ApiError(404, "Member not found in this room.");

  member.isActive = false;
  await member.save();

  await handleMemberDeparture(room, member);

  res.json({ message: "You have left the room." });
});

// POST /api/rooms/:roomCode/members/:memberId/kick
// Lets the current room creator remove another member (e.g. someone who
// moved out of the PG but forgot to leave the room themselves).
const kickMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const requesterId = (req.body || {}).requesterId;

  if (!isObjectId(memberId)) throw new ApiError(400, "Invalid member.");
  if (!isObjectId(requesterId)) throw new ApiError(400, "Invalid request.");

  const room = await findActiveRoomByCode(req.params.roomCode);

  const requester = await Member.findOne({ _id: requesterId, room: room._id, isActive: true });
  if (!requester || !requester.isCreator) {
    throw new ApiError(403, "Only the room creator can remove members.");
  }

  if (String(requesterId) === String(memberId)) {
    throw new ApiError(400, "Use Leave Room to remove yourself.");
  }

  const member = await Member.findOne({ _id: memberId, room: room._id, isActive: true });
  if (!member) throw new ApiError(404, "Member not found in this room.");

  member.isActive = false;
  await member.save();

  await handleMemberDeparture(room, member);

  res.json({ message: `${member.name} has been removed from the room.` });
});

module.exports = {
  createRoom,
  joinRoom,
  getRoomOverview,
  getMembers,
  leaveRoom,
  kickMember,
  buildRoomStats,
};
