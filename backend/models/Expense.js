const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    item: {
      type: String,
      required: [true, "Expense name is required"],
      trim: true,
      maxlength: [60, "Expense name must be 60 characters or fewer"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "Note must be 200 characters or fewer"],
      default: "",
    },
  },
  { timestamps: true }
);

// Serves both "all expenses for a room" and "newest first" queries.
expenseSchema.index({ room: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
