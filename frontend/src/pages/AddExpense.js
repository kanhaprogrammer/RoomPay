import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { toInputDate } from "../utils/format";
import { expenseApi } from "../api/api";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";

const ITEM_SUGGESTIONS = ["Milk", "Vegetables", "Electricity", "Gas", "Rent", "Wi-Fi", "Cleaning", "Groceries"];

export default function AddExpense() {
  const { room, refresh } = useRoom();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    item: "",
    amount: "",
    date: toInputDate(new Date()),
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const next = {};
    if (!form.item.trim()) next.item = "Please enter an expense name.";
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Please enter a valid expense amount.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await expenseApi.add({
        roomCode: room.roomCode,
        item: form.item,
        amount: Number(form.amount),
        date: form.date,
        note: form.note,
      });
      showSuccess("Expense added.");
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "32px 0 60px", maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Add an expense</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 28 }}>
        Log what was paid for so the room can keep an accurate running total.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="item">Item / Expense name</label>
            <input
              id="item"
              className={`input ${errors.item ? "has-error" : ""}`}
              list="item-suggestions"
              placeholder="e.g. Milk"
              value={form.item}
              onChange={update("item")}
            />
            <datalist id="item-suggestions">
              {ITEM_SUGGESTIONS.map((s) => (
                <option value={s} key={s} />
              ))}
            </datalist>
            {errors.item && <div className="error-text">{errors.item}</div>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                className={`input ${errors.amount ? "has-error" : ""}`}
                placeholder="e.g. 450"
                value={form.amount}
                onChange={update("amount")}
              />
              {errors.amount && <div className="error-text">{errors.amount}</div>}
            </div>
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" className="input" value={form.date} onChange={update("date")} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="note">Note (optional)</label>
            <input
              id="note"
              className="input"
              placeholder="e.g. Monthly grocery shopping"
              value={form.note}
              onChange={update("note")}
            />
          </div>

          <Button type="submit" block loading={submitting} loadingText="Saving...">
            Add Expense
          </Button>
        </form>
      </div>
    </div>
  );
}
