import React from "react";
import { getInitials, formatDateLong } from "../utils/format";

export default function MemberCard({ member, showJoinDate = false, canKick = false, onKick }) {
  return (
    <div className="member-card">
      <div className="avatar">{getInitials(member.name)}</div>
      <div className="member-info">
        <div className="member-name">
          {member.name}
          {member.isCreator && <span className="badge badge-primary">Creator</span>}
        </div>
        {showJoinDate && member.joinedAt && (
          <div className="member-stat-row">
            <span>Joined</span>
            <strong>{formatDateLong(member.joinedAt)}</strong>
          </div>
        )}
        {canKick && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ marginTop: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
            onClick={() => onKick(member)}
          >
            Remove from room
          </button>
        )}
      </div>
    </div>
  );
}
