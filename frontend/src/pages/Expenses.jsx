import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExpenseTable from "../components/ExpenseTable";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { expenseApi } from "../api/api";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";

const SEARCH_DEBOUNCE_MS = 300;

export default function Expenses() {
  const { room } = useRoom();
  const { showError } = useToast();

  const [expenses, setExpenses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const latestRequest = useRef(0);

  // Wait until the user pauses typing before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const id = ++latestRequest.current;
    setLoading(true);

    expenseApi
      .list(room.roomCode, { search, sort })
      .then((data) => {
        if (id === latestRequest.current) setExpenses(data.expenses);
      })
      .catch((err) => {
        if (id === latestRequest.current) showError(err.message);
      })
      .finally(() => {
        if (id === latestRequest.current) setLoading(false);
      });

    // Responses from superseded requests are ignored (and after unmount).
    return () => {
      latestRequest.current += 1;
    };
  }, [room.roomCode, search, sort, showError]);

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
          type="search"
          placeholder="Search by item name"
          aria-label="Search expenses by item name"
          maxLength={100}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="select"
          aria-label="Sort expenses"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      <div className="card">
        {!expenses ? (
          <div className="page-loading" style={{ padding: 40 }}>
            <span className="spinner spinner-dark" />
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            message={
              search
                ? "Try a different search term to see more expenses."
                : "Start tracking your shared spending by adding your first expense."
            }
            action={
              !search ? (
                <Link to="/dashboard/add-expense">
                  <Button>Add Expense</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <ExpenseTable expenses={expenses} />
          </div>
        )}
      </div>
    </div>
  );
}
