import React from "react";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <h3 style={{ marginBottom: 10 }}>{title}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>{message}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            loadingText="Please wait..."
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
