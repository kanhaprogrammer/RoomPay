import React from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { useRoom } from "../context/RoomContext";

function FullPageMessage({ title, message, children }) {
  return (
    <div className="auth-main" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="auth-card card" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: 10 }}>{title}</h1>
          <p className="subtitle">{message}</p>
          <div style={{ display: "grid", gap: 10 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { session, loading, error, room, currentMember, stats, clearSession, refresh } = useRoom();
  const navigate = useNavigate();

  const goHome = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // `!room && !error` covers the single render between joining a room and the
  // first fetch starting, so users never see a flash of the error screen.
  if (loading || (!room && !error)) {
    return (
      <div className="page-loading">
        <span className="spinner spinner-dark" />
        Loading your room...
      </div>
    );
  }

  if (error || !room) {
    return (
      <FullPageMessage
        title="We couldn't load this room"
        message={error || "This room may no longer exist."}
      >
        <Button block onClick={refresh}>
          Try again
        </Button>
        <Button block variant="secondary" onClick={goHome}>
          Back to Home
        </Button>
      </FullPageMessage>
    );
  }

  // The room loaded but this device's member is gone (e.g. the creator removed
  // them). Don't let them keep adding expenses to a room they've been removed from.
  if (stats && !currentMember) {
    return (
      <FullPageMessage
        title="You're no longer in this room"
        message="You may have been removed by the room creator. You can rejoin with the room code."
      >
        <Button block onClick={goHome}>
          Back to Home
        </Button>
      </FullPageMessage>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
