import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { room, leaveRoom } = useRoom();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const copyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      showSuccess("Room code copied!");
    } catch {
      showError("Couldn't copy the code. Copy it manually from the dashboard.");
    }
    close();
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveRoom();
      showSuccess("You left the room.");
      navigate("/");
    } catch (err) {
      showError(err.message);
    } finally {
      setLeaving(false);
      setConfirmLeave(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="brand">
          <span className="brand-mark">R</span>
          Room Pay
        </div>

        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/dashboard" end className="nav-link" onClick={close}>
            Dashboard
          </NavLink>
          <NavLink to="/dashboard/add-expense" className="nav-link" onClick={close}>
            Add Expense
          </NavLink>
          <NavLink to="/dashboard/expenses" className="nav-link" onClick={close}>
            Expenses
          </NavLink>
          <NavLink to="/dashboard/members" className="nav-link" onClick={close}>
            Members
          </NavLink>
          <button type="button" className="nav-link" onClick={copyCode}>
            Room Code: {room ? room.roomCode : "..."}
          </button>
          <button
            type="button"
            className="nav-link danger"
            onClick={() => {
              setConfirmLeave(true);
              close();
            }}
          >
            Leave Room
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this room?"
        message="You'll stop seeing this room's expenses on this device. You can always rejoin later with the room code."
        confirmLabel="Leave room"
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </nav>
  );
}
