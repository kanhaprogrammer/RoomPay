import React from "react";
import { formatCurrency, formatDate } from "../utils/format";

export default function RecentExpenseList({ expenses }) {
  return (
    <div className="recent-list">
      {expenses.map((expense) => (
        <div className="recent-item" key={expense._id}>
          <div>
            <div style={{ fontWeight: 600 }}>{expense.item}</div>
            <div className="recent-meta">{formatDate(expense.date)}</div>
          </div>
          <div className="recent-amount">{formatCurrency(expense.amount)}</div>
        </div>
      ))}
    </div>
  );
}
