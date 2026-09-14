import React, { useState } from "react";
import MemberCard from "../components/MemberCard";
import ConfirmDialog from "../components/ConfirmDialog";
import { useRoom } from "../context/RoomContext";
import { useToast } from "../context/ToastContext";
import { roomApi } from "../api/api";

export default function Members() {
  const { room, stats, session, currentMember, refresh } = useRoom();
  const { showSuccess, showError } = useToast();
  const [kicking, setKicking] = useState(null);
  const [kickLoading, setKickLoading] = useState(false);

  const isCreator = !!(currentMember && currentMember.isCreator);

  const handleKick = async () => {
    setKickLoading(true);
    try {
      await roomApi.kick(room.roomCode, kicking.id, session.memberId);
      showSuccess(`${kicking.name} was removed from the room.`);
      setKicking(null);
      await refresh();
    } catch (err) {
      showError(err.message);
    } finally {
      setKickLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="section-header">
        <h1 style={{ fontSize: 24 }}>Room Members</h1>
      </div>

      <div className="member-grid">
        {stats.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            showJoinDate
            canKick={isCreator && String(member.id) !== String(session.memberId)}
            onKick={setKicking}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!kicking}
        title="Remove this member?"
        message={
          kicking
            ? `${kicking.name} will be removed from the room and will need a room code to rejoin.`
            : ""
        }
        confirmLabel="Remove"
        loading={kickLoading}
        onConfirm={handleKick}
        onCancel={() => setKicking(null)}
      />
    </div>
  );
}
