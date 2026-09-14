import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { roomApi } from "../api/api";

const SESSION_KEY = "roompay_session";
const RoomContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function RoomProvider({ children }) {
  const [session, setSessionState] = useState(readSession);
  const [room, setRoom] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setSession = useCallback((next) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSessionState(next);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionState(null);
    setRoom(null);
    setStats(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!session || !session.roomCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await roomApi.getOverview(session.roomCode);
      setRoom(data.room);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
      setRoom(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session && session.roomCode]);

  const currentMember = useMemo(() => {
    if (!stats || !session) return null;
    return stats.members.find((m) => String(m.id) === String(session.memberId)) || null;
  }, [stats, session]);

  const leaveRoom = useCallback(async () => {
    if (!session) return;
    await roomApi.leave(session.roomCode, session.memberId);
    clearSession();
  }, [session, clearSession]);

  const value = {
    session,
    setSession,
    clearSession,
    room,
    stats,
    currentMember,
    loading,
    error,
    refresh,
    leaveRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
}
