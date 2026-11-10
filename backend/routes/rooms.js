const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRoomOverview,
  getMembers,
  leaveRoom,
  kickMember,
} = require("../controllers/roomController");

router.post("/", createRoom);
router.post("/join", joinRoom);
router.get("/:roomCode", getRoomOverview);
router.get("/:roomCode/members", getMembers);
router.delete("/:roomCode/members/:memberId", leaveRoom);
router.post("/:roomCode/members/:memberId/kick", kickMember);

module.exports = router;
