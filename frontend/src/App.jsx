import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoomProvider } from "./context/RoomContext";
import { ToastProvider } from "./context/ToastContext";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import RoomCreated from "./pages/RoomCreated";
import JoinRoom from "./pages/JoinRoom";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import AddExpense from "./pages/AddExpense";
import Expenses from "./pages/Expenses";
import Members from "./pages/Members";

export default function App() {
  return (
    <ToastProvider>
      <RoomProvider>
        <BrowserRouter>
          <Routes>
            {/* Only reachable when NOT currently in a room. Anyone with an
                active session is sent straight to /dashboard instead. */}
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <Home />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/create-room"
              element={
                <PublicOnlyRoute>
                  <CreateRoom />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/join-room"
              element={
                <PublicOnlyRoute>
                  <JoinRoom />
                </PublicOnlyRoute>
              }
            />

            {/* Reachable right after creating a room, even though a session
                already exists at that point - intentionally not wrapped in
                PublicOnlyRoute. */}
            <Route path="/room-created" element={<RoomCreated />} />

            {/* Only reachable when a room session exists. DashboardLayout
                redirects to "/" otherwise - this also blocks manually typing
                these URLs while logged out. */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="add-expense" element={<AddExpense />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="members" element={<Members />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RoomProvider>
    </ToastProvider>
  );
}
