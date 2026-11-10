import React from "react";
import { formatCurrency, formatDate } from "../utils/format";

export default function ExpenseTable({ expenses }) {
  return (
    <div className="table-wrap responsive-cards">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense._id}>
              <td data-label="Item">
                <div style={{ fontWeight: 600 }}>{expense.item}</div>
                {expense.note && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}>
                    {expense.note}
                  </div>
                )}
              </td>
              <td data-label="Amount" className="amount-cell">
                {formatCurrency(expense.amount)}
              </td>
              <td data-label="Date">{formatDate(expense.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
