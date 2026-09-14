import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useToast } from "../context/ToastContext";

export default function RoomCreated() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);

  if (!state) {
    // Someone navigated here directly without creating a room first.
    return <Navigate to="/create-room" replace />;
  }

  const { roomName, roomCode, createdBy } = state;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      showSuccess("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Couldn't copy automatically - please copy the code manually.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-topbar">
        <div className="container">
          <Link to="/" className="brand" style={{ display: "inline-flex" }}>
            <span className="brand-mark">R</span>
            Room Pay
          </Link>
        </div>
      </div>

      <div className="auth-main">
        <div className="container">
          <div className="auth-card card">
            <div className="success-icon">✓</div>
            <h1>Room created successfully</h1>
            <p className="subtitle">Share the room code below with your roommates.</p>

            <div className="summary-list">
              <div className="summary-row">
                <span className="label">Room Name</span>
                <span className="value">{roomName}</span>
              </div>
              <div className="summary-row">
                <span className="label">Created By</span>
                <span className="value">{createdBy}</span>
              </div>
            </div>

            <div className="field">
              <label>Room Code</label>
              <div className="code-pill" style={{ justifyContent: "space-between", width: "100%" }}>
                <span className="code-text">{roomCode}</span>
                <Button size="sm" variant="secondary" onClick={copyCode}>
                  {copied ? "Copied!" : "Copy Room Code"}
                </Button>
              </div>
            </div>

            <div className="success-actions">
              <Button block onClick={() => navigate("/dashboard")}>
                Go to Room
              </Button>
              <Link to="/" style={{ textAlign: "center" }}>
                <Button block variant="ghost">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
