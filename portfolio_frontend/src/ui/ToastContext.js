import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function _id() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides simple toast notifications without extra dependencies. */
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const pushToast = useCallback(
    ({ type = "success", title, message, ttlMs = 3500 }) => {
      const id = _id();
      const toast = { id, type, title, message };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      const timer = setTimeout(() => removeToast(id), ttlMs);
      timers.current.set(id, timer);
      return id;
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toasts, pushToast, removeToast }), [toasts, pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastStack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "toast",
              t.type === "error" ? "toastError" : "toastSuccess",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <p className="toastTitle">{t.title || (t.type === "error" ? "Error" : "Success")}</p>
            {t.message ? <p className="toastBody">{t.message}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to access toast context. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
