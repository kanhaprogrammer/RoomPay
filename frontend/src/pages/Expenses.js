import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ExpenseTable from "../components/ExpenseTable";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { expenseApi } from "../api/api";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";

export default function Expenses() {
  const { room } = useRoom();
  const { showError } = useToast();

  const [expenses, setExpenses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", sort: "newest" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await expenseApi.list(room.roomCode, filters);
      setExpenses(data.expenses);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="section-header">
        <h1 style={{ fontSize: 24 }}>Expenses</h1>
        <Link to="/dashboard/add-expense">
          <Button size="sm">Add Expense</Button>
        </Link>
      </div>

      <div className="filter-bar">
        <input
          className="input search-input"
          placeholder="Search by item name"
          value={filters.search}
          onChange={updateFilter("search")}
        />
        <select className="select" value={filters.sort} onChange={updateFilter("sort")}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      <div className="card">
        {loading || !expenses ? (
          <div className="page-loading" style={{ padding: 40 }}>
            <span className="spinner spinner-dark" />
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            message={
              filters.search
                ? "Try a different search term to see more expenses."
                : "Start tracking your shared spending by adding your first expense."
            }
            action={
              !filters.search ? (
                <Link to="/dashboard/add-expense">
                  <Button>Add Expense</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <ExpenseTable expenses={expenses} />
        )}
      </div>
    </div>
  );
}
