const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      maxlength: [60, "Room name must be 60 characters or fewer"],
    },
    roomCode: {
      type: String,
      required: true,
      unique: true, // creates the index - no separate `index: true` needed
      uppercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
