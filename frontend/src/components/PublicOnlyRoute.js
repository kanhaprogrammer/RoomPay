import React from "react";
import { Navigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

// Wrap pages that only make sense for someone NOT currently in a room
// (Home, Create Room, Join Room). Once a session exists, sends them to
// their dashboard instead - they must Leave Room before they can create
// or join a different one.
export default function PublicOnlyRoute({ children }) {
  const { session } = useRoom();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
