import React from "react";
import { formatCurrency } from "../utils/format";

export default function StatStrip({ stats }) {
  const items = [
    { label: "Total Expenses", value: formatCurrency(stats.totalExpense) },
    { label: "Total Members", value: stats.memberCount },
    { label: "Number of Expenses", value: stats.expenseCount },
  ];

  return (
    <div className="stat-strip">
      {items.map((item) => (
        <div className="stat-cell" key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="stat-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
