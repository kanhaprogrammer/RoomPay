const express = require("express");
const router = express.Router();
const { addExpense, listExpenses, getRecentExpenses } = require("../controllers/expenseController");

router.post("/", addExpense);
router.get("/:roomCode/recent", getRecentExpenses);
router.get("/:roomCode", listExpenses);

module.exports = router;
