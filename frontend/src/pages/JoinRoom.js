import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { roomApi } from "../api/api";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useRoom();
  const { showError } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!roomCode.trim()) next.roomCode = "Room code is required.";
    if (!name.trim()) next.name = "Your name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await roomApi.join(roomCode, name);
      setSession({
        roomCode: data.room.roomCode,
        memberId: data.member.id,
        memberName: data.member.name,
      });
      navigate("/dashboard");
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
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
            <h1>Join a room</h1>
            <p className="subtitle">Enter the room code your roommate shared with you.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="roomCode">Room ID / Room Code</label>
                <input
                  id="roomCode"
                  className={`input ${errors.roomCode ? "has-error" : ""}`}
                  placeholder="e.g. AB7K92"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  style={{ letterSpacing: 2, fontWeight: 600 }}
                />
                {errors.roomCode && <div className="error-text">{errors.roomCode}</div>}
              </div>

              <div className="field">
                <label htmlFor="yourName">Your name</label>
                <input
                  id="yourName"
                  className={`input ${errors.name ? "has-error" : ""}`}
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <Button type="submit" block loading={submitting} loadingText="Joining...">
                Join Room
              </Button>
            </form>

            <div className="auth-footer-note">
              Don't have a room yet? <Link to="/create-room">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
