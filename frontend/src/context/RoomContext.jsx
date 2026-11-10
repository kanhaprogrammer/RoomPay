import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { roomApi } from "../api/api";

const SESSION_KEY = "roompay_session";
const FOCUS_REFRESH_MIN_GAP_MS = 15000;
const RoomContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Ignore anything that isn't a complete session (corrupted / old format).
    if (parsed && typeof parsed.roomCode === "string" && typeof parsed.memberId === "string") {
      return parsed;
    }
  } catch {
    // localStorage unavailable or invalid JSON - behave as logged out.
  }
  return null;
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode / storage full: the session just won't survive a reload.
  }
}

export function RoomProvider({ children }) {
  const [session, setSessionState] = useState(readSession);
  const [room, setRoom] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(readSession()));
  const [error, setError] = useState("");

  const roomCode = session ? session.roomCode : null;
  const requestId = useRef(0); // lets us ignore out-of-date responses
  const hasData = useRef(false); // true once the current room has loaded
  const lastFetchAt = useRef(0);

  const setSession = useCallback((next) => {
    writeSession(next);
    setSessionState(next);
  }, []);

  const clearSession = useCallback(() => {
    requestId.current += 1;
    hasData.current = false;
    writeSession(null);
    setSessionState(null);
    setRoom(null);
    setStats(null);
    setError("");
    setLoading(false);
  }, []);

  // Loads the room overview. The full-page loader only appears for the first
  // load of a room - later refreshes (after adding an expense, on tab focus)
  // update quietly in the background instead of blanking the whole screen.
  const refresh = useCallback(async () => {
    if (!roomCode) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    lastFetchAt.current = Date.now();
    if (!hasData.current) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await roomApi.getOverview(roomCode);
      if (id !== requestId.current) return;
      hasData.current = true;
      setRoom(data.room);
      setStats(data.stats);
      setError("");
    } catch (err) {
      if (id !== requestId.current) return;
      // A transient failure while we already have data: keep showing it.
      if (hasData.current && err.status !== 404) return;
      hasData.current = false;
      setError(err.message);
      setRoom(null);
      setStats(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [roomCode]);

  // (Re)load whenever the active room changes.
  useEffect(() => {
    hasData.current = false;
    refresh();
  }, [refresh]);

  // Pick up changes made by roommates when the user comes back to the tab.
  useEffect(() => {
    if (!roomCode) return undefined;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchAt.current < FOCUS_REFRESH_MIN_GAP_MS) return;
      refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [roomCode, refresh]);

  const currentMember = useMemo(() => {
    if (!stats || !session) return null;
    return stats.members.find((m) => String(m.id) === String(session.memberId)) || null;
  }, [stats, session]);

  const leaveRoom = useCallback(async () => {
    if (!session) return;
    try {
      await roomApi.leave(session.roomCode, session.memberId);
    } catch (err) {
      // 404 means we're already out (removed by the creator, or the room was
      // archived) - treat that as success instead of trapping the user.
      if (err.status !== 404) throw err;
    }
    clearSession();
  }, [session, clearSession]);

  const value = useMemo(
    () => ({
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
    }),
    [session, setSession, clearSession, room, stats, currentMember, loading, error, refresh, leaveRoom]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
}
