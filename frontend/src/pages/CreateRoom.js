import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { roomApi } from "../api/api";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useRoom();
  const { showError } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!roomName.trim()) next.roomName = "Room name is required.";
    if (!name.trim()) next.name = "Your name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await roomApi.create(roomName, name);
      setSession({
        roomCode: data.room.roomCode,
        memberId: data.member.id,
        memberName: data.member.name,
      });
      navigate("/room-created", {
        state: {
          roomName: data.room.roomName,
          roomCode: data.room.roomCode,
          createdBy: data.member.name,
        },
      });
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
            <h1>Create a room</h1>
            <p className="subtitle">Set up a shared space for your flat, PG, or hostel room.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="roomName">Room name</label>
                <input
                  id="roomName"
                  className={`input ${errors.roomName ? "has-error" : ""}`}
                  placeholder="e.g. Boys PG Room or Flat 204"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
                {errors.roomName && <div className="error-text">{errors.roomName}</div>}
              </div>

              <div className="field">
                <label htmlFor="yourName">Your name</label>
                <input
                  id="yourName"
                  className={`input ${errors.name ? "has-error" : ""}`}
                  placeholder="e.g. Kanha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <Button type="submit" block loading={submitting} loadingText="Creating...">
                Create Room
              </Button>
            </form>

            <div className="auth-footer-note">
              Already have a room code? <Link to="/join-room">Join a room</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
