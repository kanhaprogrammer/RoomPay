import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { useRoom } from "../context/RoomContext";

export default function DashboardLayout() {
  const { session, loading, error, room, clearSession } = useRoom();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner spinner-dark" />
        Loading your room...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="auth-main" style={{ minHeight: "100vh" }}>
        <div className="container">
          <div className="auth-card card" style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: 10 }}>We couldn't load this room</h1>
            <p className="subtitle">{error || "This room may no longer exist."}</p>
            <Button
              block
              onClick={() => {
                clearSession();
                window.location.href = "/";
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
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
