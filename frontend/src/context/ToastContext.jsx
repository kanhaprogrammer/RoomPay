import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    (message, type = "default") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  // Clear any pending timers if the provider ever unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  // Stable identity so consumers don't re-render (or re-run effects) on every toast.
  const value = useMemo(
    () => ({
      showSuccess: (msg) => showToast(msg, "success"),
      showError: (msg) => showToast(msg, "error"),
      showInfo: (msg) => showToast(msg, "default"),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
