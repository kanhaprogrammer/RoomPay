import React, { useState } from "react";
import { Link } from "react-router-dom";
import StatStrip from "../components/StatStrip";
import MemberCard from "../components/MemberCard";
import RecentExpenseList from "../components/RecentExpenseList";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../utils/format";

export default function DashboardHome() {
  const { room, stats } = useRoom();
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      showSuccess("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Couldn't copy the code. Copy it manually.");
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1>{room.roomName}</h1>
            <p className="tagline">Manage your shared expenses in one place.</p>
          </div>
          <div className="code-pill">
            <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>Room Code</span>
            <span className="code-text">{room.roomCode}</span>
            <Button size="sm" variant="secondary" onClick={copyCode}>
              {copied ? "Copied!" : "Copy Room Code"}
            </Button>
          </div>
        </div>
      </div>

      <StatStrip stats={stats} />

      <section className="page-section">
        <div className="section-header">
          <h2>Room Members</h2>
          <Link to="/dashboard/members" className="nav-link" style={{ padding: 0 }}>
            View all
          </Link>
        </div>
        <div className="member-grid">
          {stats.members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Recent Expenses</h2>
          <Link to="/dashboard/expenses">
            <Button size="sm" variant="secondary">
              View All Expenses
            </Button>
          </Link>
        </div>
        <div className="card">
          {stats.recentExpenses.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              message="Start tracking your shared spending by adding your first expense."
              action={
                <Link to="/dashboard/add-expense">
                  <Button>Add Expense</Button>
                </Link>
              }
            />
          ) : (
            <RecentExpenseList expenses={stats.recentExpenses} />
          )}
        </div>
      </section>

      {stats.expenseCount > 0 && (
        <section className="page-section">
          <div className="section-header">
            <h2>Equal Share</h2>
          </div>
          <div className="card">
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
              Splitting {formatCurrency(stats.totalExpense)} equally across{" "}
              {stats.memberCount} member{stats.memberCount === 1 ? "" : "s"} works out to{" "}
              <strong>{formatCurrency(stats.equalShare)}</strong> per person.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
