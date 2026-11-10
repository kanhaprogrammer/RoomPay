const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [40, "Name must be 40 characters or fewer"],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    isCreator: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A name should only appear once per room (case-insensitive) so totals
// aren't accidentally split across "Kanha" and "kanha". Members who have
// left (isActive: false) don't hold on to their name.
memberSchema.index(
  { room: 1, name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { isActive: true },
  }
);

module.exports = mongoose.model("Member", memberSchema);
